

import { useParams, useNavigate } from "react-router-dom";
import RuletaComponent from "../components/RuletaComponent";

export default function RuletaPage() {
  const { especialidad, curso } = useParams();
  const navigate = useNavigate();

  function handleSelect(sector) {
    // Navegar a la página de preguntas de la materia seleccionada
    // Pasar también el curso para filtrar las preguntas
    navigate(`/preguntas/${sector.ruta}`, { 
      state: { 
        sector,
        curso,
        especialidad
      } 
    });
  }

  return (
    <div>
      
      <RuletaComponent onFinish={handleSelect} />
    </div>
  );
}
