<template>
  <ConfirmDialog></ConfirmDialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useConfirm } from "primevue/useconfirm";
import router from '@/router';

const confirm = useConfirm();

onMounted(() => {
  confirm.require({
    message: 'Do you want to logout?',
    header: 'XSSpecter',
    icon: 'pi pi-info-circle',
    rejectLabel: 'Cancel',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Logout',
      severity: 'danger'
    },
    accept: async () => {
      try {
        const response = await fetch("/api/users/logout", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (!response.ok) {
          console.error("Error during logout:", response);
          localStorage.setItem("user", JSON.stringify({}));
          router.push("/");
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Error during logout:", error);
        router.push("/");
      }
    },
    reject: () => {
      router.push("/");
    }
  });
});
</script>