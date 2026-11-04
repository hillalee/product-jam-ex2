import { DirectionProvider } from "@base-ui/react/direction-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Spinner, ToastProvider, TooltipProvider } from "./components";
import { AuthProvider, RequireAuth } from "./lib/auth";
import { DIRECTION, SHOW_DEMOS } from "./lib/config";
import { Layout } from "./pages/Layout";

const HomePage = lazy(() => import("./pages/home/HomePage"));
const SignInPage = lazy(() => import("./pages/signin/SignInPage"));
const AuthCallbackPage = lazy(() => import("./pages/auth/AuthCallbackPage"));
const EventsPage = lazy(() => import("./pages/events/EventsPage"));
const TicTacToePage = lazy(() => import("./pages/tic-tac-toe/TicTacToePage"));
const NasaPage = lazy(() => import("./pages/nasa/NasaPage"));
const EventNewPage = lazy(() => import("./pages/events/EventNewPage"));
const EventDetailPage = lazy(() => import("./pages/events/EventDetailPage"));
const EventEditPage = lazy(() => import("./pages/events/EventEditPage"));
const DesignPage = lazy(() => import("./pages/design/DesignPage"));
const ComponentsPage = lazy(() => import("./pages/components/ComponentsPage"));
const DemosPage = lazy(() => import("./pages/demos/DemosPage"));
const BlankDemoPage = lazy(() => import("./pages/demos/BlankDemoPage"));
const ElementsDemoPage = lazy(() => import("./pages/demos/ElementsDemoPage"));
const VizDemoPage = lazy(() => import("./pages/demos/VizDemoPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DirectionProvider direction={DIRECTION}>
        <TooltipProvider>
          <ToastProvider>
            <BrowserRouter>
              <AuthProvider>
                <Suspense
                  fallback={
                    <main>
                      <Spinner />
                    </main>
                  }
                >
                  <Routes>
                    <Route path="/signin" element={<SignInPage />} />
                    <Route
                      path="/auth/callback"
                      element={<AuthCallbackPage />}
                    />

                    <Route element={<Layout />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/design" element={<DesignPage />} />

                      <Route element={<RequireAuth />}>
                        <Route
                          path="/tic-tac-toe"
                          element={<TicTacToePage />}
                        />
                        <Route path="/nasa" element={<NasaPage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/new" element={<EventNewPage />} />
                        <Route
                          path="/events/:id"
                          element={<EventDetailPage />}
                        />
                        <Route
                          path="/events/:id/edit"
                          element={<EventEditPage />}
                        />
                      </Route>

                      {SHOW_DEMOS ? (
                        <>
                          <Route
                            path="/components"
                            element={<ComponentsPage />}
                          />
                          <Route path="/demos" element={<DemosPage />} />
                          <Route
                            path="/demos/blank"
                            element={<BlankDemoPage />}
                          />
                          <Route
                            path="/demos/elements"
                            element={<ElementsDemoPage />}
                          />
                          <Route path="/demos/viz" element={<VizDemoPage />} />
                        </>
                      ) : null}

                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </Suspense>
              </AuthProvider>
            </BrowserRouter>
          </ToastProvider>
        </TooltipProvider>
      </DirectionProvider>
    </QueryClientProvider>
  );
}
