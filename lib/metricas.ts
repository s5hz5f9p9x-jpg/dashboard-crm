import { dividirSeguro } from "./format";

export interface MetricasSemanaCalculadas {
  leadsCaptados: number;
  leadsCalificados: number;
  llamadasAgendadas: number;
  llamadasRealizadas: number;
  clientesNuevos: number;
  inversionPublicitariaUsd: number;
}

export interface TasasDerivadas {
  tasaCalificacion: number | null;
  tasaAsistencia: number | null;
  tasaCierre: number | null;
  costoLeadCalificado: number | null;
  cacCanalPago: number | null;
}

/**
 * SPEC.md sección 5.6. Todas las divisiones están guardadas contra
 * denominador cero — dividirSeguro devuelve null (se muestra "—" en la UI),
 * nunca NaN ni Infinity.
 */
export function calcularTasasDerivadas(m: MetricasSemanaCalculadas): TasasDerivadas {
  return {
    tasaCalificacion: dividirSeguro(m.leadsCalificados, m.leadsCaptados),
    tasaAsistencia: dividirSeguro(m.llamadasRealizadas, m.llamadasAgendadas),
    tasaCierre: dividirSeguro(m.clientesNuevos, m.llamadasRealizadas),
    costoLeadCalificado: dividirSeguro(m.inversionPublicitariaUsd, m.leadsCalificados),
    cacCanalPago: dividirSeguro(m.inversionPublicitariaUsd, m.clientesNuevos),
  };
}
