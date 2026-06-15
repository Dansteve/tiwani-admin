// The single toast entry point. Re-exports sonner's imperative `toast` so call sites import from here
// (one place to swap or wrap later), and the <Toaster /> (mounted once in state/Providers.tsx) renders
// them on the brand surface. Use toast.success / toast.error / toast.message for transient feedback after
// an action; do not put it in render.

export { toast } from "sonner";
