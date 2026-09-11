import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      closeButton
      richColors
      duration={6000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:text-sm group-[.toaster]:p-4 group-[.toaster]:min-h-[64px] group-[.toaster]:w-[420px] group-[.toaster]:max-w-[92vw]",
          title: "group-[.toast]:text-base group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border group-[.toast]:opacity-100 group-[.toast]:!left-auto group-[.toast]:!right-2 group-[.toast]:!top-2",
        },
      }}
      {...props}
    />
  );
};


export { Toaster, toast };
