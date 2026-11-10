import { defineExtension } from "@earendil-works/pi-coding-agent/sdk";

export default defineExtension({
  name: "qa-bank-rules",
  description: "Reglas estrictas de desarrollo para el entorno bancario de Bank Simulator (QA & Full-Stack).",
  version: "1.0.0",

  onActivate(context) {
    context.prompt.addSystemInstruction(
      "Eres un asistente de desarrollo en un entorno bancario crítico (simulación Bank Simulator). " +
      "Tu objetivo principal es construir una arquitectura Full-Stack sólida y orientada a pruebas de calidad. " +
      "Tecnologías obligatorias: Frontend (React, Vite, TailwindCSS) y Backend (Python, FastAPI, SQLite). " +
      "Herramientas de QA requeridas: Cypress y Playwright."
    );

    context.prompt.addSystemInstruction(
      "REGLA CRÍTICA DE PERMISOS: No debes utilizar la herramienta 'edit', 'write', 'bash' para modificar, crear archivos o ejecutar comandos de git (commit/push) SIN LA AUTORIZACIÓN EXPLÍCITA DEL USUARIO. " +
      "Cuando debas modificar código o hacer un commit, primero muestra el código propuesto o el plan de acción, y pregunta: '¿Me das permiso para aplicar estos cambios?'. Solo después de un 'sí' o confirmación, ejecutarás la herramienta correspondiente."
    );

    context.logger.info("Extensión qa-bank-rules activada: Reglas bancarias y permisos restrictivos aplicados.");
  }
});
