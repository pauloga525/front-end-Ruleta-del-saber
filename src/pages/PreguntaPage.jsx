import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { obtenerPreguntasPorCategoria } from "../utils/api";
import fondoRuletaImg from "../assets/fondos/fondoruleta.png";
import flechaImg from "../assets/ruleta/flecha.png";
import botonGirarImg from "../assets/botones/girar.png";
import CorrectoImg from "../assets/notificaciones/Correcto.png";
import IncorrectoImg from "../assets/notificaciones/Incorrecto.png";
import TiempoAgotadoImg from "../assets/notificaciones/TiempoAgotado.svg";
import comodin5050Img from "../assets/botones/comodin5050.png";
import soundIncorrectoMP3 from "../assets/sonidos/Incorrecto.mp3";
import soundCorrectoMP3 from "../assets/sonidos/Sonido Correcto.mp3";
import timerTicksMP3 from "../assets/sonidos/timer-ticks.mp3";

export default function PreguntaPage() {
	const { materia } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	
	// Mapeo de nombres de materias para mostrar correctamente
	const nombresMaterias = {
		'ensenanzas-religiosas': 'Enseñanzas Religiosas',
		'ensenanza-religiosa': 'Enseñanza Religiosa',
		'enseñanza-religiosa': 'Enseñanza Religiosa',
		'matematica': 'Matemática',
		'matematicas': 'Matemáticas',
		'ingles': 'Inglés',
		'lengua-y-literatura': 'Lengua y Literatura',
		'ciencias-naturales': 'Ciencias Naturales',
		'educacion-fisica': 'Educación Física',
		'historia': 'Historia',
		'fisica': 'Física',
		'quimica': 'Química',
		'biologia': 'Biología',
		'razonamiento-abstracto': 'Razonamiento Abstracto'
	};
	
	// Mapeo de nombres de cursos para mostrar correctamente
	const nombresCursos = {
		'1erob': '1ero de Bachillerato',
		'1rob': '1ro de Bachillerato',
		'1ero b': '1ero de Bachillerato',
		'1ro b': '1ro de Bachillerato',
		'2dob': '2do de Bachillerato',
		'2do b': '2do de Bachillerato',
		'3erob': '3ero de Bachillerato',
		'3rob': '3ro de Bachillerato',
		'3ero b': '3ero de Bachillerato',
		'3ro b': '3ro de Bachillerato'
	};
	
	// Obtener el nombre correcto de la materia
	const materiaDisplay = nombresMaterias[materia] || materia.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
	
	// Obtener curso desde location.state (enviado por la ruleta via navigate)
	const curso = location?.state?.curso || location?.state?.sector?.curso || null;
	
	// Log de depuración para verificar que el curso llega correctamente
	console.log(`🔍 PreguntaPage - materia: "${materia}", curso recibido: "${curso}"`);
	console.log(`🔍 location.state completo:`, location?.state);
	console.log(`🌐 URL del fetch será: /api/preguntas/${materia}${curso ? `?curso=${encodeURIComponent(curso)}` : ' (SIN curso - revisar navigate)'}`);
	
	if (!curso) {
		console.warn(`⚠️ ADVERTENCIA: curso es null/undefined. Las preguntas NO se filtrarán por curso.`);
		console.warn(`⚠️ Verifica que el navigate() en la ruleta incluya: state: { curso: "1ro", ... }`);
	}
	
	// Obtener el nombre formateado del curso
	const cursoDisplay = curso ? (nombresCursos[curso.toLowerCase()] || curso) : curso;
    
	// Estados principales
	const [preguntasMateria, setPreguntasMateria] = useState([]);
	const [cargandoPreguntas, setCargandoPreguntas] = useState(true);
	const [errorCarga, setErrorCarga] = useState(null);
	const [spinning, setSpinning] = useState(false);
	const [angle, setAngle] = useState(0);
	const [hoverGirar, setHoverGirar] = useState(false);
	const [hoverRegresarRuleta, setHoverRegresarRuleta] = useState(false);
	const [hoverRegresarPregunta, setHoverRegresarPregunta] = useState(false);
	const [mostrarModal, setMostrarModal] = useState(false);
	const [preguntaActual, setPreguntaActual] = useState(null);
	const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);
	const [mostrarResultado, setMostrarResultado] = useState(false);
	const [mostrarRespuestaCorrecta, setMostrarRespuestaCorrecta] = useState(false);
	const [respuestasCorrectas, setRespuestasCorrectas] = useState(0);
	const [totalRespondidas, setTotalRespondidas] = useState(0);
	const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
	const [esRespuestaCorrecta, setEsRespuestaCorrecta] = useState(null);
	// Por defecto iniciar en 45 segundos (0 minutos, 45 segundos)
	const [minutos, setMinutos] = useState(0);
	const [segundos, setSegundos] = useState(45);
	const [tiempoEnCurso, setTiempoEnCurso] = useState(false);
	const [cincuentaCincuentaUsado, setCincuentaCincuentaUsado] = useState(false);
	const [opcionesOcultas, setOpcionesOcultas] = useState([]);
	const [preguntasRespondidas, setPreguntasRespondidas] = useState([]);
	const [sonoNotificacion, setSonoNotificacion] = useState(false);
	const [totalPreguntasRespondidas, setTotalPreguntasRespondidas] = useState(0);
	const [tiempoAgotado, setTiempoAgotado] = useState(false);
	const [yaRespondio, setYaRespondio] = useState(false);
	const [botonDeshabilitado, setBotonDeshabilitado] = useState(false);
	
	const correctoAudioRef = useRef(null);
	const incorrectoAudioRef = useRef(null);
	const timerTicksAudioRef = useRef(null);
	const minutosInputRef = useRef(null);
	const segundosInputRef = useRef(null);
	const suspensoIntervalRef = useRef(null);
	const timerSoundPlayingRef = useRef(false);

	// Clave para sessionStorage - debe estar después de los estados
	const sessionKey = useMemo(() => `preguntasRespondidas_${materia}_${curso || 'default'}`, [materia, curso]);
	// Clave global para el contador del curso completo
	const sessionKeyCurso = useMemo(() => `contadorCurso_${curso || 'default'}`, [curso]);
	
	// Variables derivadas
	const numPreguntas = preguntasMateria.length;

	// === AUDIO SINTETIZADO TIPO RULETA ===
	const wheelCtxRef = useRef(null);
	const wheelOscRef = useRef(null);
	const wheelGainRef = useRef(null);

	// Función para el sonido de cuenta regresiva usando el archivo timer-ticks.mp3
	const playSuspensoSound = () => {
		try {
			const audio = timerTicksAudioRef.current;
			if (audio && audio.paused) {
				audio.play().then(() => {
					timerSoundPlayingRef.current = true;
				}).catch((err) => {
					console.error('Error al reproducir:', err);
				});
			}
		} catch (err) {
			console.error('Error al reproducir sonido de cuenta regresiva:', err);
		}
	};

	// Función para detener el sonido de suspenso
	const stopSuspensoSound = () => {
		if (suspensoIntervalRef.current) {
			clearInterval(suspensoIntervalRef.current);
			suspensoIntervalRef.current = null;
		}
		// Detener el audio del timer si está reproduciéndose
		const audio = timerTicksAudioRef.current;
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
			timerSoundPlayingRef.current = false;
		}
	};
	const lastTickIdxRef = useRef(null);
	const prevAngleRef = useRef(0);

	useEffect(() => {
		// Inicializar AudioContext al montar
		try {
			if (!wheelCtxRef.current) {
				wheelCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
			}
		} catch {}
		return () => {
			if (wheelCtxRef.current) {
				wheelCtxRef.current.close();
				wheelCtxRef.current = null;
			}
		};
	}, []);

	function startWheelSound() {
		// El contexto ya está creado, no hacer nada
	}

	function stopWheelSound() {
		try {
			if (wheelCtxRef.current) {
				wheelCtxRef.current.close();
				wheelCtxRef.current = null;
			}
			wheelOscRef.current = null;
			wheelGainRef.current = null;
		} catch {}
	}

	function playWheelTick() {
		try {
			const ctx = wheelCtxRef.current;
			if (!ctx) return;
			const osc = ctx.createOscillator();
			const g = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(1200, ctx.currentTime);
			g.gain.setValueAtTime(0.15, ctx.currentTime);
			g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
			osc.connect(g);
			g.connect(ctx.destination);
			osc.start();
			osc.stop(ctx.currentTime + 0.06);
		} catch {}
	}

	function playSelectionSound() {
		try {
			const ctx = new (window.AudioContext || window.webkitAudioContext)();
			const now = ctx.currentTime;
			// Primer tono
			const osc1 = ctx.createOscillator();
			const g1 = ctx.createGain();
			osc1.type = 'sine';
			osc1.frequency.setValueAtTime(523, now); // C5
			g1.gain.setValueAtTime(0.3, now);
			g1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
			osc1.connect(g1);
			g1.connect(ctx.destination);
			osc1.start(now);
			osc1.stop(now + 0.3);
			// Segundo tono (armonía)
			const osc2 = ctx.createOscillator();
			const g2 = ctx.createGain();
			osc2.type = 'sine';
			osc2.frequency.setValueAtTime(659, now + 0.08); // E5
			g2.gain.setValueAtTime(0.0, now);
			g2.gain.setValueAtTime(0.25, now + 0.08);
			g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
			osc2.connect(g2);
			g2.connect(ctx.destination);
			osc2.start(now + 0.08);
			osc2.stop(now + 0.4);
			// Tercer tono
			const osc3 = ctx.createOscillator();
			const g3 = ctx.createGain();
			osc3.type = 'sine';
			osc3.frequency.setValueAtTime(784, now + 0.16); // G5
			g3.gain.setValueAtTime(0.0, now);
			g3.gain.setValueAtTime(0.2, now + 0.16);
			g3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
			osc3.connect(g3);
			g3.connect(ctx.destination);
			osc3.start(now + 0.16);
			osc3.stop(now + 0.5);
			setTimeout(() => ctx.close(), 600);
		} catch {}
	}
	// === FIN AUDIO ===

	useEffect(() => {
		const correcto = new Audio(soundCorrectoMP3);
		const incorrecto = new Audio(soundIncorrectoMP3);
		const timerTicks = new Audio(timerTicksMP3);
		correcto.preload = "auto";
		incorrecto.preload = "auto";
		timerTicks.preload = "auto";
		correcto.volume = 0.85;
		incorrecto.volume = 1.0;
		timerTicks.volume = 1.0;
		timerTicks.loop = true; // Reproducir en loop continuo
		
		// Optimizar para loop sin gaps
		timerTicks.addEventListener('ended', () => {
			timerTicks.currentTime = 0;
			timerTicks.play();
		});
		
		correctoAudioRef.current = correcto;
		incorrectoAudioRef.current = incorrecto;
		timerTicksAudioRef.current = timerTicks;
		return () => {
			try {
				correcto.pause(); correcto.src = "";
				incorrecto.pause(); incorrecto.src = "";
				timerTicks.pause(); timerTicks.src = "";
			} catch {}
			stopWheelSound();
		};
	}, []);

	// Cargar preguntas de la base de datos
	useEffect(() => {
		let mounted = true;
		
		async function fetchPreguntas() {
			setCargandoPreguntas(true);
			setErrorCarga(null);
			try {
				console.log(`📥 Cargando preguntas de la categoría: ${materia}, curso: ${curso}`);
				const data = await obtenerPreguntasPorCategoria(materia, curso);
				
				console.log('📦 Datos recibidos:', data);
				
				if (mounted) {
					if (Array.isArray(data) && data.length > 0) {
						setPreguntasMateria(data);
						console.log(`✅ Cargadas ${data.length} preguntas de ${materia} (curso: ${curso})`);
					} else {
						console.warn(`⚠️ No se encontraron preguntas para ${materia} en curso ${curso}`);
						console.warn('⚠️ Datos recibidos:', data);
						setErrorCarga(`No se encontraron preguntas para la categoría "${materia}" en el curso seleccionado`);
					}
				}
			} catch (err) {
				console.error(`❌ Error al cargar preguntas:`, err);
				console.error(`❌ Detalles del error:`, err.message, err.stack);
				if (mounted) {
					setErrorCarga(`Error al conectar con el servidor. Asegúrate de que el backend esté ejecutándose en http://localhost:5000`);
				}
			} finally {
				if (mounted) {
					console.log('🏁 Finalizando carga de preguntas');
					setCargandoPreguntas(false);
				}
			}
		}

		fetchPreguntas();
		return () => { mounted = false; };
	}, [materia, curso]);

	// Cargar preguntas respondidas desde sessionStorage
	useEffect(() => {
		try {
			const saved = sessionStorage.getItem(sessionKey);
			if (saved) {
				const ids = JSON.parse(saved);
				if (Array.isArray(ids) && ids.length > 0) {
					setPreguntasRespondidas(ids);
					console.log(`📋 Cargadas ${ids.length} preguntas respondidas de sessionStorage`);
				}
			}
			// Cargar contador global del curso
			const savedContador = sessionStorage.getItem(sessionKeyCurso);
			if (savedContador) {
				const contador = parseInt(savedContador, 10);
				if (!isNaN(contador)) {
					setTotalPreguntasRespondidas(contador);
					console.log(`📊 Contador del curso cargado: ${contador} preguntas`);
				}
			}
		} catch (err) {
			console.error('Error al cargar preguntas respondidas:', err);
		}
	}, [sessionKey, sessionKeyCurso]);

	// Guardar preguntas respondidas en sessionStorage cuando cambien
	useEffect(() => {
		if (preguntasRespondidas.length > 0) {
			try {
				sessionStorage.setItem(sessionKey, JSON.stringify(preguntasRespondidas));
				console.log(`💾 Guardadas ${preguntasRespondidas.length} preguntas respondidas`);
			} catch (err) {
				console.error('Error al guardar en sessionStorage:', err);
			}
		}
	}, [preguntasRespondidas, sessionKey]);

	// Guardar contador global del curso
	useEffect(() => {
		if (totalPreguntasRespondidas > 0) {
			try {
				sessionStorage.setItem(sessionKeyCurso, totalPreguntasRespondidas.toString());
				console.log(`💾 Contador del curso guardado: ${totalPreguntasRespondidas}`);
			} catch (err) {
				console.error('Error al guardar contador del curso:', err);
			}
		}
	}, [totalPreguntasRespondidas, sessionKeyCurso]);

	// Detectar cambio de curso y resetear progreso del curso anterior
	useEffect(() => {
		const cursoAnteriorKey = 'ultimoCursoActivo';
		const cursoAnterior = sessionStorage.getItem(cursoAnteriorKey);
		
		if (cursoAnterior && cursoAnterior !== curso) {
			console.log(`🔄 Cambio de curso detectado: ${cursoAnterior} → ${curso}`);
			console.log(`🧹 Reseteando progreso del curso anterior (${cursoAnterior})...`);
			
			// Limpiar todas las claves relacionadas con el curso anterior
			const keysToRemove = [];
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				// Buscar claves que contengan el curso anterior
				if (key && (
					key.includes(`_${cursoAnterior}`) || 
					key.startsWith(`preguntasRespondidas_`) && key.endsWith(`_${cursoAnterior}`) ||
					key === `contadorCurso_${cursoAnterior}` ||
					key.startsWith(`ruletaAngle_`) && key.endsWith(`_${cursoAnterior}`) ||
					key.startsWith(`ultimoSector_`) && key.endsWith(`_${cursoAnterior}`)
				)) {
					keysToRemove.push(key);
				}
			}
			
			// Eliminar todas las claves encontradas
			keysToRemove.forEach(key => {
				sessionStorage.removeItem(key);
				console.log(`  🗑️ Eliminada clave: ${key}`);
			});
			
			console.log(`✅ Progreso del curso ${cursoAnterior} reseteado completamente`);
		}
		
		// Guardar el curso actual como el último activo
		if (curso) {
			sessionStorage.setItem(cursoAnteriorKey, curso);
		}
	}, [curso]);

	// Limpiar preguntas respondidas solo al recargar la página
	useEffect(() => {
		// Detectar cuando el usuario sale de la página (F5 o cerrar pestaña)
		const handleBeforeUnload = () => {
			// Limpiar sessionStorage al actualizar la página
			sessionStorage.removeItem(sessionKey);
			// NO limpiamos el contador del curso aquí, solo las preguntas de la materia
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [sessionKey]);

	// Filtrar preguntas disponibles (no respondidas)
	const preguntasDisponibles = preguntasMateria.filter(p => 
		!preguntasRespondidas.includes(p._id || p.id)
	);
	const numPreguntasDisponibles = preguntasDisponibles.length;
	
	console.log(`📊 Total preguntas: ${preguntasMateria.length}, Disponibles: ${numPreguntasDisponibles}, Respondidas: ${preguntasRespondidas.length}`);

	const ANGULO_POR_PREGUNTA = numPreguntasDisponibles > 0 ? 360 / numPreguntasDisponibles : 360;
	const OFFSET_INICIAL = -14;

	const determinarPregunta = (anguloFinal) => {
		if (numPreguntasDisponibles === 0) return null;
		
		let anguloNormalizado = anguloFinal % 360;
		if (anguloNormalizado < 0) anguloNormalizado += 360;

		let anguloReferencia = (360 - anguloNormalizado + OFFSET_INICIAL) % 360;
		if (anguloReferencia < 0) anguloReferencia += 360;

		let anguloDesplazado = (anguloReferencia + ANGULO_POR_PREGUNTA / 2) % 360;
		if (anguloDesplazado < 0) anguloDesplazado += 360;

		let indice = Math.floor(anguloDesplazado / ANGULO_POR_PREGUNTA);
		if (indice >= numPreguntasDisponibles) indice = numPreguntasDisponibles - 1;

		return preguntasDisponibles[indice];
	};

	function iniciarGiro() {
		if (spinning || numPreguntas === 0 || preguntaActual !== null) return;
		
		// Verificar si quedan preguntas sin responder
		if (numPreguntasDisponibles === 0) {
			alert(`¡Felicitaciones! Has respondido todas las ${numPreguntas} preguntas disponibles de esta materia.`);
			// Limpiar las preguntas respondidas de esta materia
			try {
				sessionStorage.removeItem(sessionKey);
			} catch {}
			navigate(-1);
			return;
		}

		setSpinning(true);
		lastTickIdxRef.current = null;
		prevAngleRef.current = angle;
		startWheelSound();

		const vueltasMinimas = 6;
		const vueltasCompletas = 360 * vueltasMinimas;
		
		// Seleccionar una pregunta aleatoria de las disponibles
		const preguntaObjetivoIdx = Math.floor(Math.random() * numPreguntasDisponibles);
		
		// Calcular el ángulo al centro del sector de la pregunta objetivo
		const anguloAlCentroDelSector = preguntaObjetivoIdx * ANGULO_POR_PREGUNTA + (ANGULO_POR_PREGUNTA / 2);
		
		// Calcular cuánto necesitamos girar desde el ángulo actual
		const anguloActualNormalizado = ((angle % 360) + 360) % 360;
		let anguloAGirar = anguloAlCentroDelSector - anguloActualNormalizado;
		
		// Asegurarnos de que giramos hacia adelante
		if (anguloAGirar < 0) {
			anguloAGirar += 360;
		}
		
		// Agregar las vueltas completas más el ángulo para llegar al centro del sector
		const destino = angle + vueltasCompletas + anguloAGirar;

		const duracion = 4000;
		const inicio = performance.now();
		const angInicial = angle;

		function animar(t) {
			const p = Math.min((t - inicio) / duracion, 1);
			const eased = 1 - Math.pow(1 - p, 3);
			const actual = angInicial + (destino - angInicial) * eased;

			setAngle(actual);

			// Tick al cruzar borde de sector
			const norm = ((actual % 360) + 360) % 360;
			const idx = Math.floor(norm / ANGULO_POR_PREGUNTA);
			if (lastTickIdxRef.current !== idx) {
				const prevNorm = ((prevAngleRef.current % 360) + 360) % 360;
				const prevIdx = Math.floor(prevNorm / ANGULO_POR_PREGUNTA);
				if (((idx - prevIdx + numPreguntasDisponibles) % numPreguntasDisponibles) === 1) playWheelTick();
				lastTickIdxRef.current = idx;
			}
			prevAngleRef.current = actual;

			if (p < 1) {
				requestAnimationFrame(animar);
			} else {
				stopWheelSound();
				playSelectionSound();
				setSpinning(false);
				setAngle(actual);
				
				// Deshabilitar el botón después del giro
				setBotonDeshabilitado(true);

				const pregunta = determinarPregunta(actual);
				
				if (!pregunta) {
					// No hay más preguntas disponibles
					alert(`¡Felicitaciones! Has respondido todas las ${numPreguntas} preguntas disponibles de esta materia.`);
					// Limpiar las preguntas respondidas de esta materia
					try {
						sessionStorage.removeItem(sessionKey);
					} catch {}
					navigate(-1);
					return;
				}

				// Mostrar modal con la pregunta seleccionada
				setMostrarModal(true);
				
				// Cerrar modal después de 1 segundo
				setTimeout(() => {
					setMostrarModal(false);
					
					// Mostrar la pregunta inmediatamente después de cerrar el modal
					setTimeout(() => {
						setPreguntaActual(pregunta);
						setRespuestaSeleccionada(null);
						setMostrarResultado(false);
					}, 0);
				}, 1000);
			}
		}

		requestAnimationFrame(animar);
	}

	// Detectar tecla espacio para girar la ruleta
	useEffect(() => {
		const handleKeyPress = (event) => {
			// Solo activar si es la tecla espacio y no hay una pregunta actual mostrada
			if (event.code === 'Space' && preguntaActual === null && !spinning && !botonDeshabilitado && numPreguntas > 0 && !mostrarModal) {
				event.preventDefault(); // Evitar scroll de página
				iniciarGiro();
			}
		};

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, [preguntaActual, spinning, botonDeshabilitado, numPreguntas, numPreguntasDisponibles, mostrarModal]);

	const handleCincuentaCincuenta = () => {
		if (!preguntaActual || cincuentaCincuentaUsado || respuestaSeleccionada !== null) return;
		
		// Solo se puede usar si el tiempo está agotado
		const tiempoTotal = minutos * 60 + segundos;
		if (tiempoTotal > 0 && !tiempoAgotado) return;
		
		// Obtener índices de respuestas incorrectas
		const incorrectas = preguntaActual.opciones
			.map((_, idx) => idx)
			.filter(idx => idx !== preguntaActual.correcta);
		
		// Seleccionar aleatoriamente 2 incorrectas para ocultar
		const shuffle = incorrectas.sort(() => Math.random() - 0.5);
		const aOcultar = shuffle.slice(0, 2);
		
		setOpcionesOcultas(aOcultar);
		setCincuentaCincuentaUsado(true);
		
		// Agregar 20 segundos al tiempo
		setSegundos(20);
		setMinutos(0);
		
		// Resetear estado de tiempo agotado y ocultar notificación
		setTiempoAgotado(false);
		setMostrarNotificacion(false);
		
		// Iniciar el temporizador automáticamente
		setTiempoEnCurso(true);
	};

	const handleRespuesta = (indiceOpcion) => {
		if (!preguntaActual) return;

		const esCorrecta = indiceOpcion === preguntaActual.correcta;

		// Si la respuesta es correcta y aún no se había respondido, pausamos el temporizador
		if (!yaRespondio && esCorrecta) {
			setTiempoEnCurso(false);
			stopSuspensoSound(); // Detener sonido de suspenso al responder
		}

		// Mostrar estado de selección visualmente
		setRespuestaSeleccionada(indiceOpcion);
		setMostrarResultado(true);
		setMostrarRespuestaCorrecta(esCorrecta);
		setEsRespuestaCorrecta(esCorrecta);
		// Si el usuario selecciona tras tiempo agotado, limpiar la marca de tiempo agotado
		if (tiempoAgotado) setTiempoAgotado(false);
		
		// Reproducir sonido en cada respuesta
		try {
			const aCorrecto = correctoAudioRef.current;
			const aIncorrecto = incorrectoAudioRef.current;
			if (aCorrecto && aIncorrecto) {
				// detener cualquier reproducción en curso
				aCorrecto.pause(); aCorrecto.currentTime = 0;
				aIncorrecto.pause(); aIncorrecto.currentTime = 0;
				// reproducir el correspondiente
				const toPlay = esCorrecta ? aCorrecto : aIncorrecto;
				toPlay.play().catch(() => {});
			}
		} catch (err) {
			console.error('Error al reproducir sonido:', err);
		}

		// Lógica para correcto vs incorrecto
		if (esCorrecta) {
			// Mostrar notificación de correcto siempre al seleccionar
			setMostrarNotificacion(true);
			// Si aún no se había registrado la respuesta, actualizar contadores y marcar
			// PERO: si se usó el 50/50, NO incrementar el contador de preguntas
			if (!yaRespondio) {
				setRespuestasCorrectas(prev => prev + 1);
				setTotalRespondidas(prev => prev + 1);

				const preguntaId = preguntaActual._id || preguntaActual.id;
				console.log(`✅ Marcando pregunta ${preguntaId} como respondida (CORRECTA)`);
				setPreguntasRespondidas(prev => {
					const nuevasRespondidas = [...prev, preguntaId];
					console.log(`📝 Nuevas preguntas respondidas: ${JSON.stringify(nuevasRespondidas)}`);
					return nuevasRespondidas;
				});

				// Solo incrementar el contador si NO se usó el 50/50
				if (!cincuentaCincuentaUsado) {
					setTotalPreguntasRespondidas(prev => prev + 1);
				}
				setYaRespondio(true);
			}
			setTimeout(() => setMostrarNotificacion(false), 1400);
		} else {
			// Respuesta incorrecta: mostrar notificación pero permitir reintentos.
			setEsRespuestaCorrecta(false);
			setMostrarNotificacion(true);
			
			// Si es la primera vez que responde (aunque sea incorrecta), marcar y contar
			if (!yaRespondio) {
				const preguntaId = preguntaActual._id || preguntaActual.id;
				console.log(`❌ Marcando pregunta ${preguntaId} como respondida (INCORRECTA)`);
				
				// Marcar pregunta como respondida para que no vuelva a salir
				setPreguntasRespondidas(prev => {
					const nuevasRespondidas = [...prev, preguntaId];
					console.log(`📝 Nuevas preguntas respondidas: ${JSON.stringify(nuevasRespondidas)}`);
					return nuevasRespondidas;
				});
				
				// Incrementar el contador solo si NO se usó el 50/50
				if (!cincuentaCincuentaUsado) {
					setTotalPreguntasRespondidas(prev => prev + 1);
					console.log(`📊 Contador incrementado - Respuesta incorrecta contada`);
				} else {
					console.log(`📊 50/50 usado - NO se cuenta en el total`);
				}
				
				setYaRespondio(true);
			}
			
			// Mantener la selección visible brevemente, luego permitir responder de nuevo.
			// No ocultamos `mostrarResultado` para que el botón "Mostrar Respuesta" siga activo.
			setTimeout(() => {
				setMostrarNotificacion(false);
				setRespuestaSeleccionada(null);
			}, 2500);
		}
	};

	// Reiniciar el contador cuando se selecciona una nueva pregunta
	useEffect(() => {
		if (preguntaActual) {
			// Iniciar cada pregunta con 45 segundos
			setMinutos(0);
			setSegundos(45);
			setTiempoEnCurso(false);
			setOpcionesOcultas([]);
			setTiempoAgotado(false);
			setYaRespondio(false);
			// Habilitar el botón al mostrar una nueva pregunta
			setBotonDeshabilitado(false);
			// No reseteamos cincuentaCincuentaUsado para permitir solo un uso por sesión
		}
	}, [preguntaActual]);

	// Temporizador controlado manualmente
	useEffect(() => {
		if (!preguntaActual || !tiempoEnCurso) return;
		if (respuestaSeleccionada !== null) return;
		
		const id = setInterval(() => {
			// Calcular el tiempo total en segundos
			const tiempoTotal = minutos * 60 + segundos;
			
			if (tiempoTotal <= 0) {
				// Tiempo agotado
				setTiempoEnCurso(false);
				stopSuspensoSound();
				
				// Reproducir solo el sonido de incorrecto sin mostrar notificación visual
				const audio = incorrectoAudioRef.current;
				if (audio) {
					audio.currentTime = 0;
					audio.play().catch(() => {});
				}
				
				// Marcar como respondida incorrectamente por tiempo agotado
				setMostrarResultado(true);
				setEsRespuestaCorrecta(false);
				setTiempoAgotado(true);
				// NO mostrar notificación visual
				// setMostrarNotificacion(true);
				
				// Contar la pregunta solo si aún no se ha contado
				// Si el 50/50 NO se ha usado: contar (tiempo inicial agotado)
				// Si el 50/50 YA se usó: NO contar (para evitar doble conteo)
				if (!cincuentaCincuentaUsado && !yaRespondio) {
					setTotalRespondidas(prev => prev + 1);
					
					// Marcar pregunta como respondida
					const preguntaId = preguntaActual._id || preguntaActual.id;
					console.log(`⏱️ Marcando pregunta ${preguntaId} como respondida (TIEMPO AGOTADO)`);
					setPreguntasRespondidas(prev => {
						const nuevasRespondidas = [...prev, preguntaId];
						console.log(`📝 Nuevas preguntas respondidas: ${JSON.stringify(nuevasRespondidas)}`);
						return nuevasRespondidas;
					});
					
					// Incrementar contador global del curso
					setTotalPreguntasRespondidas(prev => prev + 1);
					console.log(`📊 Contador incrementado - Tiempo agotado contado`);
					
					// Marcar que ya se respondió (aunque fue por tiempo)
					setYaRespondio(true);
				}
				
				return;
			}
			
			// Restar 1 segundo del tiempo total
			const nuevoTiempoTotal = tiempoTotal - 1;
			const nuevosMinutos = Math.floor(nuevoTiempoTotal / 60);
			const nuevosSegundos = nuevoTiempoTotal % 60;
			
			setMinutos(nuevosMinutos);
			setSegundos(nuevosSegundos);
		}, 1000);
		
		return () => {
			clearInterval(id);
			stopSuspensoSound();
		};
	}, [preguntaActual, tiempoEnCurso, respuestaSeleccionada, minutos, segundos]);

	// Reproducir sonido de cuenta regresiva para los últimos 10 segundos
	useEffect(() => {
		const totalSeg = minutos * 60 + segundos;
		const debeReproducir = tiempoEnCurso && respuestaSeleccionada === null && totalSeg <= 10 && totalSeg >= 1;
		
		const audio = timerTicksAudioRef.current;
		if (!audio) return;
		
		// Solo actuar cuando cambia el estado de reproducción necesario
		const estaReproduciendo = !audio.paused;
		
		if (debeReproducir && !estaReproduciendo) {
			// Iniciar reproducción solo una vez
			console.log('▶️ Iniciando sonido de cronómetro');
			const playPromise = audio.play();
			if (playPromise !== undefined) {
				playPromise.then(() => {
					console.log('✅ Cronómetro sonando en loop continuo');
				}).catch((err) => {
					console.error('❌ Error al reproducir cronómetro:', err);
				});
			}
		} else if (!debeReproducir && estaReproduciendo) {
			// Detener solo cuando realmente debe detenerse
			console.log('⏸️ Deteniendo sonido de cronómetro');
			audio.pause();
			audio.currentTime = 0;
		}
		
		// Cleanup al desmontar
		return () => {
			if (!debeReproducir && !audio.paused) {
				audio.pause();
				audio.currentTime = 0;
			}
		};
	}, [minutos, segundos, tiempoEnCurso, respuestaSeleccionada]);

	// Reproducir sonido al mostrar la notificación de correcto/incorrecto, sin solapados
	useEffect(() => {
		if (mostrarNotificacion && esRespuestaCorrecta !== null && !sonoNotificacion) {
			try {
				const aCorrecto = correctoAudioRef.current;
				const aIncorrecto = incorrectoAudioRef.current;
				if (aCorrecto && aIncorrecto) {
					// detener cualquier reproducción en curso
					aCorrecto.pause(); aCorrecto.currentTime = 0;
					aIncorrecto.pause(); aIncorrecto.currentTime = 0;
					// reproducir el correspondiente
					const toPlay = esRespuestaCorrecta ? aCorrecto : aIncorrecto;
					toPlay.play().catch(() => {});
				}
				setSonoNotificacion(true);
			} catch {}
		} else if (!mostrarNotificacion && sonoNotificacion) {
			setSonoNotificacion(false);
		}
	}, [mostrarNotificacion, esRespuestaCorrecta, sonoNotificacion]);

	// Componente Ruleta (Vista 1: Sorteo de preguntas)
	const RuletaSorteo = () => (
		<div
			style={{
				backgroundImage: `url(${fondoRuletaImg})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
				boxSizing: "border-box",
				minHeight: "100vh",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				position: "relative",
				overflowY: "auto",
				overflowX: "hidden",
			}}
		>
			{/* Contador de preguntas respondidas en la ruleta */}
			<div
				style={{
					position: "fixed",
					top: 30,
				right: 80,
				backgroundColor: "rgba(2, 29, 78, 0.93)",
				color: "white",
				padding: "12px 16px",
				borderRadius: 12,
				boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
				zIndex: 300,
				minWidth: 120,
				textAlign: "center",
				border: "2px solid transparent",
				fontFamily: "'Montserrat', sans-serif",
			}}
		>
			<div style={{ fontSize: 11, opacity: 0.9, marginBottom: 4, fontFamily: "'Montserrat', sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>📊 Preguntas</div>
			<div style={{ fontSize: 22, fontWeight: "bold", fontFamily: "'Montserrat', sans-serif", marginBottom: 2 }}>
				{totalPreguntasRespondidas}
			</div>
			<div style={{ fontSize: 11, opacity: 0.85, fontFamily: "'Montserrat', sans-serif" }}>
				respondidas
			</div>
			<div style={{ 
				marginTop: 6, 
				fontSize: 10, 
				opacity: 0.8, 
				fontFamily: "'Montserrat', sans-serif",
				borderTop: "1px solid rgba(255, 255, 255, 0.2)",
				paddingTop: 6
			}}>
				{materiaDisplay}
			</div>
			{curso && (
				<div style={{ 
					marginTop: 3, 
					fontSize: 9, 
					opacity: 0.75, 
					fontFamily: "'Montserrat', sans-serif"
				}}>
					{cursoDisplay}
				</div>
			)}
		</div>

		{/* Botón regresar */}
		<button
			onClick={() => {
				sessionStorage.removeItem(sessionKey);
				console.log(`🧹 Limpiando preguntas respondidas al regresar`);
					navigate(-1);
				}}
				onMouseEnter={() => setHoverRegresarRuleta(true)}
				onMouseLeave={() => setHoverRegresarRuleta(false)}
				onFocus={() => setHoverRegresarRuleta(true)}
				onBlur={() => setHoverRegresarRuleta(false)}
				style={{
					backgroundImage: `url('/src/assets/botones/regresar.png')`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundColor: 'transparent',
					width: 180,
					height: 60,
					border: 'none',
					cursor: 'pointer',
					position: 'absolute',
					bottom: '30px',
					left: '30px',
					zIndex: 50,
					transform: `scale(${hoverRegresarRuleta ? 1.08 : 1})`,
				transition: 'transform 160ms ease',
			}}
		></button>

			{/* Contenedor de la ruleta */}
			<div
				style={{
					position: "relative",
					marginTop: "12vh",
					width: "min(71vmin, 581px)",
					height: "min(71vmin, 581px)",
					maxWidth: "581px",
					maxHeight: "581px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{/* Ruleta SVG con sectores */}
				<svg
					style={{
						width: "105%",
						height: "105%",
						position: "absolute",
						top: "54%",
						left: "53%",
						transform: `translate(-50%, -50%) rotate(${angle}deg)`,
						transformOrigin: "50% 50%",
						transition: spinning ? 'none' : 'transform 0.6s ease-out',
						willChange: 'transform',
						zIndex: 10,
						userSelect: "none",
						pointerEvents: "none",
					}}
					viewBox="0 0 200 200"
				>
					{/* Generar sectores dinámicamente */}
					{Array.from({ length: numPreguntasDisponibles }).map((_, i) => {
						const anguloInicio = (i * 360) / numPreguntasDisponibles;
						const anguloFin = ((i + 1) * 360) / numPreguntasDisponibles;
						const colores = [
							"#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
							"#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52D273"
						];
						const color = colores[i % colores.length];
					// Obtener el ID real de la pregunta disponible
					const preguntaId = preguntasDisponibles[i]?.id || i + 1;

					return (
						<g key={i}>
							{/* Sector */}
							<path
								d={`M 100,100 L ${100 + 100 * Math.cos((anguloInicio - 90) * Math.PI / 180)},${100 + 100 * Math.sin((anguloInicio - 90) * Math.PI / 180)} A 100,100 0 ${anguloFin - anguloInicio > 180 ? 1 : 0},1 ${100 + 100 * Math.cos((anguloFin - 90) * Math.PI / 180)},${100 + 100 * Math.sin((anguloFin - 90) * Math.PI / 180)} Z`}
								fill={color}
								stroke="white"
								strokeWidth="2"
							/>
							{/* Número del sector - muestra el ID real de la pregunta */}
							<text
								x={100 + 65 * Math.cos(((anguloInicio + anguloFin) / 2 - 90) * Math.PI / 180)}
								y={100 + 65 * Math.sin(((anguloInicio + anguloFin) / 2 - 90) * Math.PI / 180)}
								textAnchor="middle"
								dominantBaseline="middle"
								style={{
									fontSize: "16px",
									fontWeight: "bold",
									fill: "white",
									textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
									pointerEvents: "none",
								}}
							>
								{preguntaId}
		</text>
	</g>
);
})}
</svg>

{/* Flecha fija */}
<img
src={flechaImg}
alt="flecha"
style={{
	width: "12%",
	height: "auto",
	position: "absolute",
	top: "-1%",
	left: "55%",
	transform: "translateX(-50%)",
	zIndex: 30,
	pointerEvents: "none",
}}
draggable={false}
/>
</div>

{/* Botón girar */}
<button
	onClick={iniciarGiro}
	disabled={spinning || botonDeshabilitado || preguntaActual !== null}
	onMouseEnter={() => setHoverGirar(true)}
	onMouseLeave={() => setHoverGirar(false)}
	onFocus={() => setHoverGirar(true)}
	onBlur={() => setHoverGirar(false)}
	style={{
		backgroundSize: 'cover',
		backgroundPosition: 'center',
		backgroundColor: 'transparent',
		width: 250,
		height: 60,
		border: 'none',
		cursor: 'pointer',
		position: 'absolute',
		bottom: '50px',
		right: '50px',
		transform: `scale(${hoverGirar ? 1.08 : 1})`,
		transition: 'transform 160ms ease',
					zIndex: 30,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<img
					src={botonGirarImg}
					alt="Botón girar"
					style={{
						width: "100%",
						height: "auto",
						opacity: (spinning || botonDeshabilitado || preguntaActual !== null) ? 0.6 : 1,
						pointerEvents: (spinning || botonDeshabilitado || preguntaActual !== null) ? "none" : "auto",
						display: "block",
					}}
					draggable={false}
				/>
			</button>

			{/* Modal anunciador de pregunta */}
			{mostrarModal && preguntaActual && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 100,
					}}
				>
					<div
						style={{
							backgroundColor: "white",
							padding: "40px",
							borderRadius: "15px",
							textAlign: "center",
							boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
							maxWidth: "400px",
							animation: "slideIn 0.3s ease-out",
						}}
					>
						<p style={{ fontSize: "32px", color: "#0066cc", fontWeight: "bold", marginBottom: "20px", fontFamily: "'Montserrat', sans-serif" }}>
							Pregunta #{preguntaActual.id}
						</p>
						<p style={{ fontSize: "14px", color: "#666", fontFamily: "'Montserrat', sans-serif" }}>
							Cargando pregunta en 1 segundo...
						</p>
					</div>
				</div>
			)}

			<style>
				{`
					@keyframes slideIn {
						from {
							transform: scale(0.8);
							opacity: 0;
						}
						to {
							transform: scale(1);
							opacity: 1;
						}
					}

					.pregunta-imagen {
						transition: transform 0.3s ease;
					}

					.pregunta-imagen:hover {
						transform: scale(1.02);
					}

					/* Estilos para el scrollbar personalizado */
					*::-webkit-scrollbar {
						width: 10px;
						height: 10px;
					}

					*::-webkit-scrollbar-track {
						background: rgba(30, 58, 138, 0.3);
						border-radius: 10px;
					}

					*::-webkit-scrollbar-thumb {
						background: rgba(78, 205, 196, 0.6);
						border-radius: 10px;
						border: 2px solid rgba(30, 58, 138, 0.3);
					}

					*::-webkit-scrollbar-thumb:hover {
						background: rgba(78, 205, 196, 0.8);
					}

					/* Responsive para tablets */
					@media (max-width: 768px) {
						.pregunta-imagen {
							max-width: 85% !important;
							max-height: min(250px, 22vh) !important;
							padding: 10px !important;
						}
					}

					/* Responsive para móviles */
					@media (max-width: 480px) {
						.pregunta-imagen {
							max-width: 90% !important;
							max-height: min(220px, 20vh) !important;
							padding: 8px !important;
							border-radius: 8px !important;
						}
					}

					/* Para pantallas muy pequeñas */
					@media (max-width: 360px) {
						.pregunta-imagen {
							max-height: min(180px, 18vh) !important;
							padding: 6px !important;
						}
					}
				`}
			</style>
		</div>
	);

	// Componente Preguntas (Vista 2: Mostrar opciones)
	const MostrarPregunta = () => (
		<div
			style={{
				backgroundImage: `url(${fondoRuletaImg})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
				boxSizing: "border-box",
				minHeight: "100vh",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				overflowY: "auto",
				overflowX: "hidden",
				padding: "40px 20px",
			}}
		>
			{/* Botón regresar */}
			<button
				onClick={() => {
					sessionStorage.removeItem(sessionKey);
					console.log(`🧹 Limpiando preguntas respondidas al regresar`);
					navigate(-1);
				}}
				onMouseEnter={() => setHoverRegresarPregunta(true)}
				onMouseLeave={() => setHoverRegresarPregunta(false)}
				onFocus={() => setHoverRegresarPregunta(true)}
				onBlur={() => setHoverRegresarPregunta(false)}
				style={{
					backgroundImage: `url('/src/assets/botones/regresar.png')`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundColor: 'transparent',
					width: 180,
					height: 60,
					border: 'none',
					cursor: 'pointer',
					position: 'absolute',
					top: '20px',
					left: '20px',
					zIndex: 50,
					transform: `scale(${hoverRegresarPregunta ? 1.08 : 1})`,
					transition: 'transform 160ms ease',
				}}
			></button>

			{/* Botón 50/50 arriba a la izquierda - solo disponible cuando se agota el tiempo */}
			<button
				onClick={handleCincuentaCincuenta}
				disabled={cincuentaCincuentaUsado || respuestaSeleccionada !== null || (!tiempoAgotado && (minutos * 60 + segundos) > 0)}
				style={{
					backgroundImage: `url(${comodin5050Img})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundColor: 'transparent',
					position: "fixed",
					top: 20,
					left: 200,
					width: 100,
					height: 100,
					border: "none",
					cursor: (cincuentaCincuentaUsado || respuestaSeleccionada !== null || (!tiempoAgotado && (minutos * 60 + segundos) > 0)) ? "not-allowed" : "pointer",
					zIndex: 300,
					transition: "transform 160ms ease, opacity 200ms ease",
					opacity: (cincuentaCincuentaUsado || respuestaSeleccionada !== null || (!tiempoAgotado && (minutos * 60 + segundos) > 0)) ? 0.4 : 1,
					filter: (!tiempoAgotado && (minutos * 60 + segundos) > 0) ? "grayscale(100%)" : "none",
				}}
				onMouseEnter={(e) => {
					if (!cincuentaCincuentaUsado && respuestaSeleccionada === null && (tiempoAgotado || (minutos * 60 + segundos) === 0)) {
						e.currentTarget.style.transform = "scale(1.08)";
					}
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.transform = "scale(1)";
				}}
			>
			</button>

			{/* Indicador de número de pregunta */}
			<div
				style={{
					position: "fixed",
					top: 30,
					left: 320,
					backgroundColor: "rgba(2, 29, 78, 0.93)",
					color: "white",
					padding: "10px 14px",
					borderRadius: 12,
					boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
					zIndex: 300,
					minWidth: 88,
					textAlign: "center",
					border: "2px solid #4ECDC4",
					fontFamily: "'Montserrat', sans-serif",
				}}
			>
				<span style={{ fontSize: 16, opacity: 0.85, fontFamily: "'Montserrat', sans-serif" }}>Pregunta</span>
				<div style={{
					fontSize: 22,
					fontWeight: "bold",
					color: "#4ECDC4",
					fontFamily: "'Montserrat', sans-serif",
				}}>
					{preguntaActual?.id || '-'}
				</div>
			</div>

		{/* Contenedor principal */}
		<div
			style={{
				backgroundColor: "#1e3a8a",
				padding: "25px 40px",
				borderRadius: "15px",
				boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
				maxWidth: "min(1400px, 95vw)",
				width: "100%",
				marginTop: "10px",
				marginBottom: "10px",
				maxHeight: "85vh",
				overflowY: "auto",
				overflowX: "hidden",
			}}
		>
			{/* Contador de preguntas respondidas - arriba a la derecha */}
			<div
				style={{
					position: "fixed",
					top: 15,
					right: 80,
					backgroundColor: "rgba(2, 29, 78, 0.93)",
					color: "white",
					padding: "12px 16px",
					borderRadius: 12,
					boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
					zIndex: 300,
					minWidth: 120,
					textAlign: "center",
					border: "2px solid transparent",
					fontFamily: "'Montserrat', sans-serif",
				}}
			>
				<div style={{ fontSize: 11, opacity: 0.9, marginBottom: 4, fontFamily: "'Montserrat', sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>📊 Preguntas</div>
				<div style={{ fontSize: 22, fontWeight: "bold", fontFamily: "'Montserrat', sans-serif", marginBottom: 2 }}>
					{totalPreguntasRespondidas}
				</div>
				<div style={{ fontSize: 11, opacity: 0.85, fontFamily: "'Montserrat', sans-serif" }}>
					respondidas
				</div>
				<div style={{ 
					marginTop: 6, 
					fontSize: 10, 
					opacity: 0.8, 
					fontFamily: "'Montserrat', sans-serif",
					borderTop: "1px solid rgba(255, 255, 255, 0.2)",
					paddingTop: 6
				}}>
					{materiaDisplay}
				</div>
				{curso && (
					<div style={{ 
						marginTop: 3, 
						fontSize: 9, 
						opacity: 0.75, 
						fontFamily: "'Montserrat', sans-serif"
					}}>
						{cursoDisplay}
					</div>
				)}
			</div>

			{/* Timer arriba a la derecha */}
			<div
				style={{
					position: "fixed",
					top: 15,
					right: 280,
					backgroundColor: "rgba(2, 29, 78, 0.93)",
					color: "white",
					padding: "10px 14px",
					borderRadius: 12,
					boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
					zIndex: 300,
					minWidth: 88,
					textAlign: "center",
					border: (minutos === 0 && segundos <= 10) ? "2px solid #F44336" : "2px solid transparent",
					fontFamily: "'Montserrat', sans-serif",
				}}
			>
				<span style={{ fontSize: 14, opacity: 0.85, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>Tiempo</span>
				<div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
<input
					ref={minutosInputRef}
					type="text"
					value={String(minutos).padStart(2, '0')}
					onChange={(e) => {
						const value = e.target.value.replace(/[^0-9]/g, "");
						const val = value === "" ? 0 : parseInt(value, 10);
						if (val <= 99) setMinutos(val);
						setTimeout(() => { if (minutosInputRef.current) minutosInputRef.current.focus(); }, 0);
					}}
					disabled={tiempoEnCurso}
					inputMode="numeric"
					style={{
						width: "38px",
						fontSize: 18,
						fontWeight: "bold",
						color: (minutos === 0 && segundos <= 10) ? "#F44336" : "#fff",
						backgroundColor: "rgba(255, 255, 255, 0.1)",
						border: "2px solid #4ECDC4",
						outline: "none",
						borderRadius: "6px",
						padding: "4px 6px",
						textAlign: "center",
						fontFamily: "'Montserrat', sans-serif",
						cursor: tiempoEnCurso ? "not-allowed" : "text",
					}}
				/>
					<span style={{ fontSize: 18, color: "#fff", fontWeight: "bold" }}>:</span>
				<input
					ref={segundosInputRef}
					type="text"
					value={String(segundos).padStart(2, '0')}
					onChange={(e) => {
						const value = e.target.value.replace(/[^0-9]/g, "");
						const val = value === "" ? 0 : parseInt(value, 10);
						if (val <= 59) setSegundos(val);
						setTimeout(() => { if (segundosInputRef.current) segundosInputRef.current.focus(); }, 0);
					}}
					disabled={tiempoEnCurso}
					inputMode="numeric"
					style={{
						width: "38px",
						fontSize: 18,
						fontWeight: "bold",
						color: (minutos === 0 && segundos <= 10) ? "#F44336" : "#fff",
						backgroundColor: "rgba(255, 255, 255, 0.1)",
						border: "2px solid #4ECDC4",
						outline: "none",
						borderRadius: "6px",
						padding: "4px 6px",
						textAlign: "center",
						fontFamily: "'Montserrat', sans-serif",
						cursor: tiempoEnCurso ? "not-allowed" : "text",
					}}
				/>
				</div>
				<div style={{ display: "flex", gap: "4px", marginTop: "6px", justifyContent: "center" }}>
					<button
						onClick={() => setTiempoEnCurso(!tiempoEnCurso)}
						style={{
							backgroundColor: tiempoEnCurso ? "#F44336" : "#4CAF50",
							color: "white",
							border: "none",
							borderRadius: "4px",
							padding: "4px 10px",
							fontSize: 12,
							cursor: "pointer",
							fontFamily: "'Montserrat', sans-serif",
							fontWeight: "600",
							transition: "all 150ms ease",
						}}
						onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
						onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
					>
						{tiempoEnCurso ? "⏸" : "▶"}
					</button>
					<button
						onClick={() => {
							setTiempoEnCurso(false);
							setMinutos(1);
			setSegundos(0);
						}}
						style={{
							backgroundColor: "#2196F3",
							color: "white",
							border: "none",
							borderRadius: "4px",
							padding: "4px 10px",
							fontSize: 12,
							cursor: "pointer",
							fontFamily: "'Montserrat', sans-serif",
							fontWeight: "600",
							transition: "all 150ms ease",
						}}
						onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
						onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
					>
						⟲
					</button>
				</div>
			</div>

{/* Encabezado de la pregunta */}
			<div style={{
				backgroundColor: "rgba(255, 255, 255, 0.08)",
				padding: "20px 25px",
				borderRadius: "12px",
				marginBottom: "20px",
				border: "2px solid rgba(78, 205, 196, 0.3)",
			}}>
				<div style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "12px",
					marginBottom: "8px",
					flexWrap: "wrap",
				}}>
					<span style={{
						color: "rgba(255, 255, 255, 0.9)",
						fontSize: "14px",
						fontFamily: "'Montserrat', sans-serif",
					}}>Categoría: {materiaDisplay}</span>
				</div>
				<h2 style={{
					fontSize: "clamp(24px, 3vw, 32px)",
					color: "#ffffff",
					margin: 0,
					lineHeight: "1.4",
					fontFamily: "'Montserrat', sans-serif",
					fontWeight: "500",
					textAlign: "center",
				}}>
					{preguntaActual.pregunta}
				</h2>
			</div>

			{/* Mostrar imagen si existe */}
			{preguntaActual.hasImage && preguntaActual.imageBase64 && (
				<div style={{ 
				backgroundColor: "rgba(255, 255, 255, 0.05)",
				padding: "12px",
				borderRadius: "10px",
				marginBottom: "12px",
				border: "2px solid rgba(78, 205, 196, 0.2)",
			}}>
				<div style={{
					color: "#4ECDC4",
					fontSize: "12px",
					fontWeight: "600",
					marginBottom: "8px",
					fontFamily: "'Montserrat', sans-serif",
					textTransform: "uppercase",
					letterSpacing: "0.5px",
				}}>📷 Material de Referencia</div>
				<div style={{ 
					display: "flex", 
					justifyContent: "center",
					width: "100%"
				}}>
					<img 
						src={preguntaActual.imageBase64.startsWith('data:') ? preguntaActual.imageBase64 : `data:image/png;base64,${preguntaActual.imageBase64}`}
						alt="Imagen de la pregunta"
						className="pregunta-imagen"
						onLoad={(e) => {
							// Forzar recalculo del layout cuando la imagen se carga
							window.dispatchEvent(new Event('resize'));
						}}
						style={{
							width: "100%",
							maxWidth: materia === 'razonamiento-abstracto' ? "min(800px, 85vw)" : (materia === 'matematicas' || materia === 'matematica') ? "min(700px, 80vw)" : "min(500px, 65vw)",
							height: "auto",
							maxHeight: materia === 'razonamiento-abstracto' ? "min(500px, 50vh)" : (materia === 'matematicas' || materia === 'matematica') ? "min(400px, 40vh)" : "min(250px, 25vh)",
							objectFit: "contain",
							borderRadius: "6px",
							boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
							backgroundColor: "white",
							padding: "8px",
							border: "2px solid #e0e0e0"
						}}
					/>
				</div>
			</div>
		)}

		{/* Sección de opciones */}
		<div style={{
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		padding: "12px",
		borderRadius: "10px",
		marginBottom: "12px",
		border: "2px solid rgba(78, 205, 196, 0.2)",
	}}>
		<div style={{
			color: "#4ECDC4",
			fontSize: "12px",
			fontWeight: "600",
			marginBottom: "10px",
			fontFamily: "'Montserrat', sans-serif",
			textTransform: "uppercase",
			letterSpacing: "0.5px",
		}}>📝 Selecciona tu respuesta</div>
		<div style={{ 
			display: 'grid',
			gridTemplateColumns: '1fr 1fr',
			gap: "8px" 
		}}>
			{preguntaActual.opciones.map((opcion, indice) => {
				// Ocultar opciones eliminadas por 50/50
				if (opcionesOcultas.includes(indice)) return null;
				const letras = ['A', 'B', 'C', 'D'];
				const estaSeleccionada = respuestaSeleccionada === indice;
				const esCorrecta = indice === preguntaActual.correcta;
				
				let backgroundColor = "#f0f0f0";
				let borderColor = "#ddd";
				let iconoEstado = "";
				
				if (mostrarResultado) {
					if (estaSeleccionada && esCorrecta) {
						backgroundColor = "#4CAF50";
						borderColor = "#388E3C";
						iconoEstado = "✓";
					} else if (estaSeleccionada && !esCorrecta) {
						backgroundColor = "#F44336";
						borderColor = "#D32F2F";
						iconoEstado = "✗";
					} else if (esCorrecta && mostrarRespuestaCorrecta) {
						backgroundColor = "#4CAF50";
						borderColor = "#388E3C";
						iconoEstado = "✓";
					}
				} else if (estaSeleccionada) {
					backgroundColor = "#2196F3";
					borderColor = "#1976D2";
				}

				// Permitir clic siempre que no se esté mostrando una notificación.
				// De este modo la selección permanece activa incluso después de responder bien.
				const puedeResponder = !mostrarNotificacion;
				
					return (
					<button
						key={indice}
						onClick={() => handleRespuesta(indice)}
						disabled={!puedeResponder}
						style={{
							display: "flex",
							alignItems: "center",
							gap: "12px",
							padding: "12px 16px",
							fontSize: "clamp(24px, 3vw, 32px)",
							fontWeight: "500",
							border: `3px solid ${borderColor}`,
							borderRadius: "12px",
							backgroundColor,
							color: mostrarResultado && (respuestaSeleccionada === indice || (indice === preguntaActual.correcta && mostrarRespuestaCorrecta)) ? "white" : "#333",
							cursor: puedeResponder ? "pointer" : "not-allowed",
							transition: "all 200ms ease",
							textAlign: "left",
							opacity: (!puedeResponder || (yaRespondio && !estaSeleccionada && !(esCorrecta && mostrarRespuestaCorrecta))) ? 0.5 : 1,
							fontFamily: "'Montserrat', sans-serif",
							boxShadow: estaSeleccionada ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.1)",
						}}
						onMouseEnter={(e) => {
							if (puedeResponder) {
								e.currentTarget.style.transform = "translateX(5px)";
								e.currentTarget.style.boxShadow = "0 4px 12px rgba(78, 205, 196, 0.3)";
							}
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.transform = "translateX(0)";
							e.currentTarget.style.boxShadow = estaSeleccionada ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.1)";
						}}
					>
						<span style={{ 
							backgroundColor: mostrarResultado && (respuestaSeleccionada === indice || (indice === preguntaActual.correcta && mostrarRespuestaCorrecta)) ? "rgba(255,255,255,0.2)" : "rgba(78, 205, 196, 0.15)",
							color: mostrarResultado && (respuestaSeleccionada === indice || (indice === preguntaActual.correcta && mostrarRespuestaCorrecta)) ? "white" : "#021D4E",
							padding: "6px 12px",
							borderRadius: "6px",
							fontWeight: "bold",
							fontSize: "16px",
							minWidth: "36px",
							textAlign: "center",
						}}>
							{letras[indice]}
						</span>
						<span style={{ flex: 1 }}>{opcion}</span>
						{iconoEstado && (
							<span style={{ 
								fontSize: "18px",
								fontWeight: "bold",
							}}>{iconoEstado}</span>
						)}
					</button>
				);
			})}
		</div>
	</div>

	</div>

	{/* Botones después de responder - Posicionados de forma fija en la parte inferior */}
	{mostrarResultado && (
			<div style={{ 
				position: "fixed", 
				bottom: "20px", 
				left: "50%", 
				transform: "translateX(-50%)",
				display: "flex", 
				gap: "15px", 
				justifyContent: "center", 
				flexWrap: "wrap",
				zIndex: 250,
				backgroundColor: "rgba(30, 58, 138, 0.95)",
				padding: "15px 25px",
				borderRadius: "15px",
				boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)",
				border: "2px solid rgba(78, 205, 196, 0.3)"
			}}>
				{/* Botón Mostrar Respuesta - solo si no se ha mostrado aún */}
				{!mostrarRespuestaCorrecta && (
					<button
						onClick={() => setMostrarRespuestaCorrecta(true)}
						style={{
							padding: "12px 30px",
							fontSize: "16px",
							fontWeight: "600",
							backgroundColor: "#FF9800",
							color: "white",
							border: "none",
							borderRadius: "10px",
							cursor: "pointer",
							transition: "all 200ms ease",
							fontFamily: "'Montserrat', sans-serif",
							boxShadow: "0 4px 12px rgba(255, 152, 0, 0.3)",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = "#F57C00";
							e.currentTarget.style.transform = "scale(1.05)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = "#FF9800";
							e.currentTarget.style.transform = "scale(1)";
						}}
					>
						Mostrar Respuesta
					</button>
				)}
				{/* Botón Regresar a la Ruleta */}
				<button
					onClick={() => {
						// Marcar la pregunta como respondida antes de regresar
						if (preguntaActual) {
							const preguntaId = preguntaActual._id || preguntaActual.id;
							setPreguntasRespondidas(prev => {
								// Solo agregar si no está ya en la lista
								if (!prev.includes(preguntaId)) {
									console.log(`✅ Marcando pregunta ${preguntaId} como respondida al regresar`);
									return [...prev, preguntaId];
								}
								return prev;
							});
						}
						
						setRespuestaSeleccionada(null);
						setPreguntaActual(null);
						setMostrarResultado(false);
						setMostrarRespuestaCorrecta(false);
						const origen = location?.state?.origen;
						const espec = location?.state?.especialidad;
						const cur = location?.state?.curso;
						if (origen === "avanzada" && espec && cur) {
							navigate(`/ruleta-avanzada/${espec}/${cur}`, { state: { fromAnsweredQuestion: true, especialidad: espec, curso: cur } });
						} else if (origen === "basica" && espec && cur) {
							navigate(`/ruleta-basica/${espec}/${cur}`, { state: { fromAnsweredQuestion: true, especialidad: espec, curso: cur } });
						} else {
							navigate(-1);
						}
					}}
					style={{
						padding: "12px 30px",
						fontSize: "16px",
						fontWeight: "600",
						backgroundColor: "#0066cc",
						color: "white",
						border: "none",
						borderRadius: "10px",
						cursor: "pointer",
						transition: "all 200ms ease",
						fontFamily: "'Montserrat', sans-serif",
						boxShadow: "0 4px 12px rgba(0, 102, 204, 0.3)",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = "#0052a3";
						e.currentTarget.style.transform = "scale(1.05)";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = "#0066cc";
						e.currentTarget.style.transform = "scale(1)";
					}}
				>
					Regresar a la Ruleta
				</button>
			</div>
		)}

	{/* Modal de notificación Correcto/Incorrecto */}
			{mostrarNotificacion && esRespuestaCorrecta !== null && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						backgroundColor: "rgba(0, 0, 0, 0.7)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 200,
					}}
				>
					<div
						style={{
							width: "450px",
							height: "450px",
							animation: "popIn 0.4s ease-out",
						}}
					>
						<img
							src={
								esRespuestaCorrecta
									? CorrectoImg
									: (respuestaSeleccionada !== null
										? IncorrectoImg
										: (tiempoAgotado ? TiempoAgotadoImg : IncorrectoImg))
							}
							alt={
								esRespuestaCorrecta
									? "Correcto"
									: (respuestaSeleccionada !== null
										? "Incorrecto"
										: (tiempoAgotado ? "Tiempo Agotado" : "Incorrecto"))
							}
							style={{
								width: "100%",
								height: "100%",
								objectFit: "contain",
							}}
						/>
					</div>
				</div>
			)}

			<style>
				{`
					@keyframes popIn {
						0% {
							transform: scale(0.5);
							opacity: 0;
						}
						70% {
							transform: scale(1.1);
						}
						100% {
							transform: scale(1);
							opacity: 1;
						}
					}
				`}
			</style>
		</div>
	);

	// Validar si hay preguntas disponibles
	if (cargandoPreguntas) {
		return (
			<div
				style={{
					backgroundImage: `url(${fondoRuletaImg})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					color: "white",
					fontSize: "24px",
					textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
				}}
			>
				<div style={{ textAlign: "center" }}>
					<div style={{ 
						display: "inline-block", 
						width: "70px", 
						height: "50px", 
						border: "5px solid rgba(255,255,255,0.3)",
						borderTop: "5px solid white",
						borderRadius: "50%",
						animation: "spin 1s linear infinite",
						marginBottom: "20px"
					}}></div>
					<p style={{ fontFamily: "'Montserrat', sans-serif" }}>Cargando preguntas de {materiaDisplay}...</p>
				</div>
				<style>{`
					@keyframes spin {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
				`}</style>
			</div>
		);
	}

	if (errorCarga || numPreguntas === 0) {
		const sinPreguntas = !errorCarga && numPreguntas === 0;
		const mensajePrincipal = sinPreguntas
			? `No hay preguntas para "${materiaDisplay}"${curso ? ` en el curso ${cursoDisplay || curso}` : ""}`
			: errorCarga;

		return (
			<div
				style={{
					backgroundImage: `url(${fondoRuletaImg})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					color: "white",
					fontSize: "24px",
					textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
					padding: "20px",
				}}
			>
				<div style={{
					backgroundColor: "rgba(0,0,0,0.7)",
					padding: "40px",
					borderRadius: "15px",
					maxWidth: "600px",
					textAlign: "center"
				}}>
					<p style={{ fontSize: "48px", marginBottom: "10px" }}>
						{sinPreguntas ? "📭" : "⚠️"}
					</p>
					<p style={{ fontSize: "22px", marginBottom: "20px", fontFamily: "'Montserrat', sans-serif", fontWeight: "bold" }}>
						{mensajePrincipal}
					</p>
					{sinPreguntas ? (
						<p style={{ fontSize: "15px", color: "#aed6f1", fontFamily: "'Montserrat', sans-serif" }}>
							Aún no se han cargado preguntas para este nivel en la base de datos.
						</p>
					) : (
						<>
							<p style={{ fontSize: "16px", marginTop: "20px", color: "#ffeb3b", fontFamily: "'Montserrat', sans-serif" }}>
								Asegúrate de que:
							</p>
							<ul style={{ 
								fontSize: "14px", 
								textAlign: "left", 
								marginTop: "15px",
								lineHeight: "1.8",
								fontFamily: "'Montserrat', sans-serif",
							}}>
								<li>El backend de Python esté corriendo (ejecuta: <code style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "3px" }}>python app.py</code>)</li>
								<li>MongoDB esté activo y tenga las preguntas migradas</li>
								<li>La categoría "{materiaDisplay}" exista en la base de datos</li>
							</ul>
						</>
					)}
					<button
						onClick={() => {
							sessionStorage.removeItem(sessionKey);
							navigate(-1);
						}}
						style={{
							marginTop: "30px",
							padding: "12px 30px",
							fontSize: "16px",
							backgroundColor: "#0066cc",
							color: "white",
							border: "none",
							borderRadius: "8px",
							cursor: "pointer",
							boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
							fontFamily: "'Montserrat', sans-serif",
						}}
					>
						← Regresar
					</button>
				</div>
			</div>
		);
	}

	// Render condicional: mostrar ruleta o preguntas
	return preguntaActual === null ? <RuletaSorteo /> : <MostrarPregunta />;
}












