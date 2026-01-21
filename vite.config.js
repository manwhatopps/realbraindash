import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cash: resolve(__dirname, 'cash.html'),
        verification: resolve(__dirname, 'verification.html'),
        verifyIdentity: resolve(__dirname, 'verify-identity.html'),
        kycSuccess: resolve(__dirname, 'kyc-success.html'),
      },
    },
  },
});
