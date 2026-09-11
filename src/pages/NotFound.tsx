import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("404: unknown route", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen bg-muted"
      data-app-render-status="not-found"
      data-testid="app-not-found"
    >
      {/* Machine-readable marker used by the thumbnail capture edge function
          to reject 404 snapshots so we never store a picture of this page
          as a page/object thumbnail. Do not remove. */}
      <meta name="x-app-render-status" content="not-found" />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs currentLabel="Page Not Found" />
      </div>
      <div className="flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
