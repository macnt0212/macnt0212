# Soluciones Integrales · Plataforma de Presupuestos y Licitaciones

<div align="center">
  <img src="public/logo.png" alt="Soluciones Integrales Logo" width="550" />
  
  **INFORMÁTICA · REDES · SEGURIDAD · ELECTRICIDAD**  
  *CUIT 20-42757904-3 · IVA Responsable Inscripto*  
  *Tel: 370 464-6635 · Email: macnt0212@gmail.com*  
  *Av. Corrientes 1450, Piso 8, Of. B, Ciudad Autónoma de Buenos Aires*
</div>

---

## 🚀 Características Principales

- **Gestión Integral de Cotizaciones y Licitaciones:** Generación de presupuestos con numeración oficial correlativa automática (`COT-2026-XXXX` y `LIC-2026-XXXX`).
- **Calculadora de Costos y Rentabilidad:** Carga de costos de mercadería, márgenes prefijados (20% estándar, 30% equipamiento, 15% volumen, etc.) o márgenes libres personalizados, cálculo de IVA (21%, 10.5%, 27%) y descuentos comerciales.
- **Formateo Monetario Automático:** Miles separados con puntos (`.`) y decimales con coma (`,`), según estándar contable argentino.
- **Exportación en PDF Oficial:** Membrete con logo corporativo oficial de Soluciones Integrales, desglose neto, cláusulas comerciales y firmas.
- **Datos Bancarios de Cobranza:** Carga manual o predeterminada de Entidad Bancaria, CBU/CVU (22 dígitos) y Alias CBU con persistencia local.
- **Condiciones Comerciales Oficiales:**
  - *Condición de Pago:* "Contra entrega y el resto a 30 días."
  - *Plazo de Entrega:* "Los equipos se entregan a partir del primer pago."
- **Tablero Kanban:** Seguimiento visual de estados (Borrador, En Revisión, Presentada, En Evaluación, Adjudicada, No Adjudicada, Vencida).
- **Ventana de Carga Optimizada:** Opción de maximizar pantalla para cargar ítems cómodamente y botón para vaciar o corregir ítems erróneos.

---

## 🛠️ Instalación y Ejecución

Para ejecutar el proyecto en tu entorno local:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```

---

## 📦 Despliegue en GitHub Pages

El proyecto ya cuenta con `base: './'` en `vite.config.ts`, lo que permite desplegarlo directamente en GitHub Pages o cualquier subdirectorio sin rutas rotas.
