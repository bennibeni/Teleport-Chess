import { Suspense } from "react";
import BoardView from "./BoardView";

export default function BoardPage() {
  return (
    <Suspense fallback={null}>
      <BoardView />
    </Suspense>
  );
}
