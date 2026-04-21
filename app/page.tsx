import { Suspense } from "react";
import Quiz from "./components/Quiz";

export default function Home() {
  return (
    <Suspense>
      <Quiz />
    </Suspense>
  );
}
