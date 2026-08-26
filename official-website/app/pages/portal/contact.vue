<script setup lang="ts">
definePageMeta({
  layout: 'portal',
})

const {
  t,
  contacts,
  formRef,
  form,
  submitted,
  submitting,
  submitError,
  rules,
  onSubmit,
  pending,
  selectRegion,
  telHref,
} = useContactPage()
</script>

<template>
  <div class="p-section">
    <div class="p-section-head">
      <div class="p-eyebrow">{{ t('template.contactEyebrow') }}</div>
      <h1>{{ t('contact.title') }}</h1>
      <p>{{ t('contact.desc') }}</p>
    </div>

    <div v-if="pending && !contacts.length" class="p-empty">{{ t('common.loading') }}</div>
    <div v-else class="p-contact-grid" style="margin-bottom: 28px">
      <button
        v-for="c in contacts"
        :key="c.id"
        class="p-contact-card"
        type="button"
        style="text-align: left; cursor: pointer; width: 100%"
        @click="selectRegion(c.id, c.regionValue)"
      >
        <span>{{ c.region }}</span>
        <strong>{{ c.name }}</strong>
        <p v-if="c.email">{{ c.email }}</p>
        <p v-if="c.phone">
          <a :href="telHref(c.phone)">{{ c.phone }}</a>
        </p>
      </button>
    </div>

    <div v-if="submitted" class="p-empty">{{ t('contact.success') }}</div>
    <el-form
      v-else
      ref="formRef"
      class="p-form"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="onSubmit"
    >
      <el-form-item :label="t('contact.name')" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item :label="t('contact.email')" prop="email">
        <el-input v-model="form.email" type="email" />
      </el-form-item>
      <el-form-item :label="t('contact.region')">
        <el-select v-model="form.region" style="width: 100%">
          <el-option
            v-for="c in contacts"
            :key="c.id"
            :label="c.region"
            :value="c.regionValue"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('contact.message')" prop="message">
        <el-input v-model="form.message" type="textarea" :rows="5" />
      </el-form-item>
      <p v-if="submitError" style="color: #ff6b6b">{{ submitError }}</p>
      <button class="p-btn" type="submit" :disabled="submitting">
        {{ submitting ? t('common.loading') : t('contact.submit') }}
      </button>
    </el-form>
  </div>
</template>
