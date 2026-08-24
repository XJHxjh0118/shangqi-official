<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { cleanInput, normalizeSubmitError } from '~/utils/form'

const { t } = useI18n()
const { createMessage } = useApi()

const { title, description } = usePageSeoMeta('join', {
  title: () => t('join.title'),
  description: () => t('join.desc'),
})

const formRef = ref<FormInstance>()
const form = reactive({ name: '', email: '', message: '' })
const submitted = ref(false)
const submitting = ref(false)
const submitError = ref('')

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('join.name'), trigger: 'blur' }],
  email: [
    { required: true, message: t('join.email'), trigger: 'blur' },
    { type: 'email', message: t('join.email'), trigger: ['blur', 'change'] },
  ],
  message: [{ required: true, message: t('join.message'), trigger: 'blur' }],
}))

async function onSubmit() {
  if (submitting.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  submitError.value = ''
  try {
    await createMessage({
      name: cleanInput(form.name),
      email: cleanInput(form.email),
      content: `[Join] ${cleanInput(form.message)}`,
    })
    submitted.value = true
  } catch (err: unknown) {
    submitError.value = normalizeSubmitError(err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-head">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </header>

      <h2 class="section-title" style="margin: 0 0 16px">{{ t('join.openingsTitle') }}</h2>
      <div class="job-grid">
        <article v-for="key in ['fitment', 'dealer', 'product']" :key="key" class="job-card">
          <h2>{{ t(`join.openings.${key}.title`) }}</h2>
          <p>{{ t(`join.openings.${key}.body`) }}</p>
        </article>
      </div>

      <p v-if="submitted" class="notice ok">{{ t('join.success') }}</p>
      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        style="max-width: 560px"
        @submit.prevent="onSubmit"
      >
        <el-form-item :label="t('join.name')" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="t('join.email')" prop="email">
          <el-input v-model="form.email" type="email" />
        </el-form-item>
        <el-form-item :label="t('join.message')" prop="message">
          <el-input v-model="form.message" type="textarea" :rows="6" />
        </el-form-item>
        <p v-if="submitError" class="notice err">{{ submitError }}</p>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="submitting">
            {{ t('join.submit') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
