<script setup lang="ts">
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
} = useContactPage()
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-head">
        <h1>{{ t('contact.title') }}</h1>
        <p>{{ t('contact.desc') }}</p>
      </header>

      <p v-if="pending && !contacts.length">{{ t('common.loading') }}</p>

      <template v-else>
        <div class="service-list" style="margin-bottom: 48px">
          <article v-for="r in contacts" :key="r.id" class="service-row">
            <h3>{{ r.region }}</h3>
            <p>{{ r.name }}</p>
            <p>
              <a v-if="r.email" :href="'mailto:' + r.email">{{ r.email }}</a>
              <span v-if="r.phone"> {{ r.phone }}</span>
            </p>
          </article>
        </div>

        <h2 class="section-title">{{ t('contact.formTitle') }}</h2>
        <p v-if="submitted" class="notice ok">{{ t('contact.success') }}</p>
        <el-form
          v-else
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          style="max-width: 560px; margin-top: 16px"
          @submit.prevent="onSubmit"
        >
          <el-form-item :label="t('contact.name')" prop="name">
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item :label="t('contact.email')" prop="email">
            <el-input v-model="form.email" type="email" />
          </el-form-item>
          <el-form-item :label="t('contact.region')" prop="region">
            <el-select v-model="form.region" style="width: 100%">
              <el-option
                v-for="r in contacts"
                :key="r.id"
                :label="r.region"
                :value="r.regionValue"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('contact.message')" prop="message">
            <el-input v-model="form.message" type="textarea" :rows="5" />
          </el-form-item>
          <p v-if="submitError" class="notice err">{{ submitError }}</p>
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="submitting">
              {{ t('contact.submit') }}
            </el-button>
          </el-form-item>
        </el-form>
      </template>
    </div>
  </div>
</template>
