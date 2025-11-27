import { toast as sonnerToast } from 'sonner@2.0.3';

type ToastArgs = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  return {
    toast: ({ title, description, variant = 'default' }: ToastArgs) => {
      if (variant === 'destructive') {
        sonnerToast.error(title, { description });
      } else {
        sonnerToast.success(title, { description });
      }
    }
  };
}
