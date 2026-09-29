import type { SuperAdminController } from '../hooks/use-super-admin-controller';

// Ayrı faylda saxlanılır: hook super.type.ts-dən istifadə edir, ona görə bu tip
// super.type.ts-də olsaydı types -> hook -> types dairəvi asılılığı yaranardı.
export type SuperAdminControllerProps = {
  controller: SuperAdminController;
};
