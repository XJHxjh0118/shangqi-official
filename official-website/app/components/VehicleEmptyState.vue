<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    variant?: 'default' | 'portal'
  }>(),
  {
    description: '',
    variant: 'default',
  },
)
</script>

<template>
  <div
    class="vehicle-empty"
    :class="[`is-${variant}`]"
    role="status"
  >
    <div class="vehicle-empty-visual" aria-hidden="true">
      <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vehicle-empty-road" x1="0" y1="0" x2="240" y2="0">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0" />
            <stop offset="18%" stop-color="currentColor" stop-opacity="0.22" />
            <stop offset="82%" stop-color="currentColor" stop-opacity="0.22" />
            <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="vehicle-empty-body" x1="52" y1="58" x2="188" y2="82">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0.18" />
            <stop offset="100%" stop-color="currentColor" stop-opacity="0.34" />
          </linearGradient>
        </defs>

        <g class="vehicle-empty-grid">
          <path d="M0 24h240M0 48h240M0 72h240M0 96h240M0 120h240" />
          <path d="M24 0v140M48 0v140M72 0v140M96 0v140M120 0v140M144 0v140M168 0v140M192 0v140M216 0v140" />
        </g>

        <ellipse
          class="vehicle-empty-glow"
          cx="120"
          cy="88"
          rx="72"
          ry="18"
        />

        <path
          class="vehicle-empty-road"
          d="M20 102h200"
          stroke="url(#vehicle-empty-road)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="10 12"
        />

        <path
          class="vehicle-empty-shadow"
          d="M62 102c18 8 98 8 116 0"
        />

        <g class="vehicle-empty-car">
          <path
            d="M58 82c8-18 24-28 44-28h36c20 0 36 10 44 28l10 14H48l10-14Z"
            fill="url(#vehicle-empty-body)"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <path
            d="M92 54h24l10 12H82l10-12Z"
            fill="currentColor"
            fill-opacity="0.12"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
          <path
            d="M74 82h92"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-opacity="0.35"
          />
          <circle cx="82" cy="96" r="11" class="vehicle-empty-wheel" />
          <circle cx="158" cy="96" r="11" class="vehicle-empty-wheel" />
          <circle cx="82" cy="96" r="4.5" class="vehicle-empty-hub" />
          <circle cx="158" cy="96" r="4.5" class="vehicle-empty-hub" />
        </g>

        <g class="vehicle-empty-signal">
          <circle cx="196" cy="58" r="3" />
          <path d="M204 58h18M210 52v12" />
        </g>
      </svg>
    </div>

    <div class="vehicle-empty-copy">
      <h3>{{ title }}</h3>
      <p v-if="description">{{ description }}</p>
      <div v-if="$slots.action" class="vehicle-empty-action">
        <slot name="action" />
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.vehicle-empty {
  --ve-surface: var(--color-surface, #15191f);
  --ve-muted: var(--color-muted, #a8adb5);
  --ve-body: var(--color-body, #c5c8ce);
  --ve-line: var(--color-hairline, #2a303a);
  --ve-accent: var(--color-accent, #c41e3a);
  --ve-ink: var(--color-ink, #f3f4f6);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 48px 20px;
  text-align: center;
}

.vehicle-empty.is-portal {
  --ve-surface: #101216;
  --ve-muted: var(--p-muted, #8d929d);
  --ve-body: #aeb3bb;
  --ve-line: var(--p-line, rgba(255, 255, 255, 0.11));
  --ve-accent: var(--p-red, #e3081f);
  --ve-ink: var(--p-text, #f2f3f5);
}

.vehicle-empty-visual {
  display: grid;
  place-items: center;
  width: min(100%, 280px);
  margin-bottom: 28px;
  padding: 28px 24px 18px;
  border: 1px solid var(--ve-line);
  border-radius: 16px;
  background:
    radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--ve-accent) 16%, transparent), transparent 58%),
    linear-gradient(180deg, color-mix(in srgb, var(--ve-surface) 88%, transparent), var(--ve-surface));
  color: var(--ve-ink);
}

.vehicle-empty-visual svg {
  width: 100%;
  max-width: 240px;
  height: auto;
}

.vehicle-empty-grid {
  stroke: var(--ve-line);
  stroke-width: 0.75;
  opacity: 0.55;
}

.vehicle-empty-glow {
  fill: color-mix(in srgb, var(--ve-accent) 18%, transparent);
}

.vehicle-empty-road {
  color: var(--ve-muted);
}

.vehicle-empty-shadow {
  stroke: color-mix(in srgb, var(--ve-accent) 34%, transparent);
  stroke-width: 8;
  stroke-linecap: round;
  opacity: 0.45;
}

.vehicle-empty-car {
  transform-origin: 50% 80%;
  animation: vehicle-empty-float 4.8s ease-in-out infinite;
}

.vehicle-empty-wheel {
  fill: color-mix(in srgb, var(--ve-ink) 10%, var(--ve-surface));
  stroke: currentColor;
  stroke-width: 1.5;
}

.vehicle-empty-hub {
  fill: color-mix(in srgb, var(--ve-accent) 55%, var(--ve-surface));
}

.vehicle-empty-signal {
  stroke: var(--ve-accent);
  stroke-width: 1.5;
  stroke-linecap: round;
  opacity: 0.8;
  animation: vehicle-empty-pulse 2.4s ease-in-out infinite;
}

.vehicle-empty-signal circle {
  fill: var(--ve-accent);
  stroke: none;
}

.vehicle-empty-copy {
  max-width: 420px;
}

.vehicle-empty-copy h3 {
  margin: 0 0 10px;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 600;
  color: var(--ve-ink);
}

.vehicle-empty-copy p {
  margin: 0;
  color: var(--ve-muted);
  font-size: 14px;
  line-height: 1.6;
}

.vehicle-empty-action {
  margin-top: 20px;
}

@keyframes vehicle-empty-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-4px);
  }
}

@keyframes vehicle-empty-pulse {
  0%,
  100% {
    opacity: 0.45;
  }

  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vehicle-empty-car,
  .vehicle-empty-signal {
    animation: none;
  }
}
</style>
