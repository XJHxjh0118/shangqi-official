<script setup lang="ts">
const { t } = useI18n()
const { template, setTemplate } = useSiteTemplate()

const open = ref(false)

function pick(next: 'classic' | 'portal') {
  open.value = false
  setTemplate(next)
}
</script>

<template>
  <div class="tpl-switch" :class="{ 'is-open': open }">
    <div v-if="open" class="tpl-switch-panel" role="dialog" :aria-label="t('template.switch')">
      <p class="tpl-switch-label">{{ t('template.switch') }}</p>
      <button
        type="button"
        class="tpl-switch-option"
        :class="{ active: template === 'classic' }"
        @click="pick('classic')"
      >
        <span class="tpl-switch-name">{{ t('template.classic') }}</span>
        <span class="tpl-switch-desc">{{ t('template.classicDesc') }}</span>
      </button>
      <button
        type="button"
        class="tpl-switch-option"
        :class="{ active: template === 'portal' }"
        @click="pick('portal')"
      >
        <span class="tpl-switch-name">{{ t('template.portal') }}</span>
        <span class="tpl-switch-desc">{{ t('template.portalDesc') }}</span>
      </button>
    </div>
    <button
      class="tpl-switch-fab"
      type="button"
      :aria-expanded="open"
      :aria-label="t('template.switch')"
      @click="open = !open"
    >
      <span class="tpl-switch-fab-mark">{{ template === 'portal' ? 'B' : 'A' }}</span>
      <span class="tpl-switch-fab-text">{{ t('template.short') }}</span>
    </button>
  </div>
</template>

<style scoped>
.tpl-switch {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 80;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.tpl-switch-panel {
  width: min(260px, calc(100vw - 36px));
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  background: rgba(12, 14, 18, 0.94);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(16px);
}

.tpl-switch-label {
  margin: 0 0 10px;
  color: #9aa0aa;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tpl-switch-option {
  display: grid;
  gap: 2px;
  width: 100%;
  margin: 0 0 8px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  color: #f2f3f5;
  text-align: left;
  cursor: pointer;
}

.tpl-switch-option:last-child {
  margin-bottom: 0;
}

.tpl-switch-option.active {
  border-color: rgba(227, 8, 31, 0.75);
  background: rgba(227, 8, 31, 0.12);
}

.tpl-switch-name {
  font-size: 13px;
  font-weight: 700;
}

.tpl-switch-desc {
  color: #9aa0aa;
  font-size: 11px;
  line-height: 1.4;
}

.tpl-switch-fab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px 0 8px;
  border: 1px solid rgba(227, 8, 31, 0.55);
  border-radius: 999px;
  background: linear-gradient(135deg, #1a1d24, #0c0d10);
  color: #fff;
  box-shadow: 0 12px 28px rgba(227, 8, 31, 0.22);
  cursor: pointer;
}

.tpl-switch-fab-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e3081f, #8b0614);
  font-size: 12px;
  font-weight: 800;
}

.tpl-switch-fab-text {
  font-size: 12px;
  font-weight: 700;
}
</style>
