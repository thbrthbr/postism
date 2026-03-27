import Swal from "sweetalert2";

export const appSwal = Swal.mixin({
  buttonsStyling: false,
  background: "var(--color-bg-primary)",
  color: "var(--color-primary)",
  confirmButtonText: "확인",
  cancelButtonText: "취소",
  reverseButtons: true,
  customClass: {
    popup: "app-swal-popup",
    title: "app-swal-title",
    htmlContainer: "app-swal-html",
    confirmButton: "app-swal-confirm",
    cancelButton: "app-swal-cancel",
    actions: "app-swal-actions",
    input: "app-swal-input",
  },
});

export const appLargeSwal = Swal.mixin({
  buttonsStyling: false,
  background: "var(--color-bg-primary)",
  color: "var(--color-primary)",
  confirmButtonText: "확인",
  cancelButtonText: "취소",
  reverseButtons: true,
  customClass: {
    popup: "app-swal-popup",
    title: "app-swal-title xl",
    htmlContainer: "app-swal-html",
    confirmButton: "app-swal-confirm",
    cancelButton: "app-swal-cancel",
    actions: "app-swal-actions",
    input: "app-swal-input",
  },
});

export const icons = {
  warning: {
    icon: "warning",
    color: "var(--color-primary)",
  },
  error: {
    icon: "error",
    color: "var(--color-primary)",
  },
  success: {
    icon: "success",
    color: "var(--color-primary)",
  },
  info: {
    icon: "info",
    color: "var(--color-primary)",
  },
  question: {
    icon: "question",
    color: "var(--color-primary)",
  },
} as const;
