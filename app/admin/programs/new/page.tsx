import ProgramForm from "../../components/ProgramForm";
import { createProgram } from "../../actions";

export default function NewProgramPage() {
  return <ProgramForm action={createProgram} heading="Add New Program" />;
}
