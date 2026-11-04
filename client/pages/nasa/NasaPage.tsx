import type { Picture } from "@shared/schemas/nasa";
import { useState } from "react";
import { Button, Card, Spinner } from "../../components";
import { useExplanation, usePictures } from "../../features/nasa/hooks";
import { ApiRequestError } from "../../lib/api";
import styles from "./NasaPage.module.css";

export default function NasaPage() {
  const pictures = usePictures();
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Pictures from space</h1>
          <p>Random pictures from NASA's Astronomy Picture of the Day.</p>
        </div>
        <Button
          variant="secondary"
          loading={pictures.isFetching}
          onClick={() => void pictures.refetch()}
        >
          New pictures
        </Button>
      </header>
      {pictures.isFetching ? (
        <p role="status">Loading pictures from NASA…</p>
      ) : null}
      {pictures.isError ? <p role="alert">{pictures.error.message}</p> : null}
      {pictures.data?.length === 0 ? (
        <p>NASA returned no usable images. Try loading a new set.</p>
      ) : null}
      <div className={styles.grid}>
        {pictures.data?.map((picture) => (
          <PictureCard key={picture.date} picture={picture} />
        ))}
      </div>
    </main>
  );
}

function PictureCard({ picture }: { picture: Picture }) {
  const explanation = useExplanation();
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const failedBefore =
    explanation.error instanceof ApiRequestError &&
    explanation.error.code === "explanation_failed";
  return (
    <Card className={styles.card}>
      {imageFailed ? (
        <p className={styles.imageMissing}>This image could not be loaded.</p>
      ) : (
        <div className={styles.imageFrame}>
          {!imageLoaded ? (
            <div className={styles.imageLoading}>
              <Spinner label="Loading image" />
            </div>
          ) : null}
          <img
            className={styles.image}
            src={picture.image_url}
            alt={picture.title}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
        </div>
      )}
      <div className={styles.text}>
        <time dateTime={picture.date}>{picture.date}</time>
        <h2>{picture.title}</h2>
        <p>{picture.explanation}</p>
        {picture.copyright ? <small>Image: {picture.copyright}</small> : null}
        {explanation.data ? (
          <section className={styles.hebrew} lang="he" dir="rtl">
            <h3>{explanation.data.title_he}</h3>
            <p>{explanation.data.summary_he}</p>
            <ul className={styles.tags} aria-label="Tags" dir="ltr">
              {explanation.data.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </section>
        ) : (
          <Button
            variant="secondary"
            loading={explanation.isPending}
            disabled={failedBefore}
            onClick={() => explanation.mutate(picture.date)}
          >
            {explanation.isPending
              ? "Writing the Hebrew explanation…"
              : failedBefore
                ? "Explanation unavailable"
                : explanation.isError
                  ? "Check explanation"
                  : "Explain in Hebrew"}
          </Button>
        )}
        <div aria-live="polite">
          {explanation.isError ? (
            <p role="alert">{explanation.error.message}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
