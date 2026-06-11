import { Suspense } from "react";
import SettingsPage from "./components/SettingsPage";

export default function Page() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  );
}