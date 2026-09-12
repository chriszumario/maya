import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function WorkspaceNotFound() {
  return (
    <Empty className="min-h-[50vh]">
      <EmptyHeader>
        <EmptyTitle>No encontramos este contenido</EmptyTitle>
        <EmptyDescription>
          Es posible que haya sido eliminado o que la dirección no sea válida.
        </EmptyDescription>
      </EmptyHeader>
      <Button render={<Link href="/" />}>Volver al inicio</Button>
    </Empty>
  );
}
