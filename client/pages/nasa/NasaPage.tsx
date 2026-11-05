import type { Explanation, Picture } from "@shared/schemas/nasa";
import { Button, Card, Spinner } from "../../components";
import { useExplainPicture, usePictures } from "../../features/nasa/hooks";
import styles from "./NasaPage.module.css";

export default function NasaPage() {
  return (
    <main>
      <h1>Space pictures</h1>
      <PictureList />
    </main>
  );
}

function PictureList() {
  const pictures = usePictures();

  if (pictures.isPending) {
    return (
      <p>
        <Spinner /> Loading pictures from NASA, this can take half a minute...
      </p>
    );
  }
  if (pictures.isError) {
    return <p>{pictures.error.message}</p>;
  }
  return (
    <div className={styles.grid}>
      {pictures.data.map((picture) => (
        <PictureCard key={picture.date} picture={picture} />
      ))}
    </div>
  );
}

function PictureCard({ picture }: { picture: Picture }) {
  const explainPicture = useExplainPicture();

  return (
    <Card>
      <img
        className={styles.image}
        src={picture.image_url}
        alt={picture.title}
      />
      <h2>{picture.title}</h2>
      <p>{picture.date}</p>
      <p>{picture.explanation}</p>

      {explainPicture.data ? (
        <HebrewExplanation explanation={explainPicture.data} />
      ) : (
        <Button
          loading={explainPicture.isPending}
          onClick={() => explainPicture.mutate(picture.date)}
        >
          {explainPicture.isPending
            ? "Gemini is thinking..."
            : "Explain in Hebrew"}
        </Button>
      )}
      {explainPicture.isError ? <p>{explainPicture.error.message}</p> : null}
    </Card>
  );
}

function HebrewExplanation({ explanation }: { explanation: Explanation }) {
  return (
    <div lang="he" dir="rtl">
      <h3>{explanation.title_he}</h3>
      <p>{explanation.summary_he}</p>
      <p>{explanation.tags.join(", ")}</p>
    </div>
  );
}
