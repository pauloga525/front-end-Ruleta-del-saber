// /src/components/CursoBoton.jsx

import React, { useState } from "react";

export default function CursoBoton({ 
    imagenSrc, 
    onClick, 
    customStyle = {}, // Estilos base opcionales pasados por el padre
    hoverStyle = {}, // Estilos de hover opcionales para personalizar el efecto
}) {
    // Estado para manejar el estilo dinámico
    const [isHovered, setIsHovered] = useState(false);

    // Estilos base por defecto (los que tenías antes)
    const defaultBaseStyle = {
        width: "100%",
        padding: "0",
        background: "transparent",
        border: "none",
        borderRadius: "20px",
        cursor: "pointer",
        overflow: "hidden",
        transition: "transform .3s, box-shadow .3s",
        ...customStyle, // Aplica estilos personalizados si se proporcionan
    };

    // Estilos al pasar el mouse por defecto (efecto de crecimiento/sombra)
    const defaultHoverStyle = {
        transform: "scale(1.07)",
        
        ...hoverStyle, // Sobrescribe con estilos de hover personalizados si se proporcionan
    };

    // Estilos finales: combina el base y el hover si está activo
    const finalStyle = isHovered 
        ? { ...defaultBaseStyle, ...defaultHoverStyle } 
        : defaultBaseStyle;

    return (
        <button
            onClick={onClick}
            style={finalStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img
                src={imagenSrc}
                alt="Curso"
                loading="eager"
                decoding="async"
                style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    borderRadius: "20px",
                }}
            />
        </button>
    );
}