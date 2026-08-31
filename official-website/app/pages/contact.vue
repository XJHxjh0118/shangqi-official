<script setup lang="ts">
import { PhEnvelopeSimple, PhPhone } from '@phosphor-icons/vue'
import { isRichHtml, prepareRichHtml } from '~/utils/richHtml'

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
  selectedContact,
  selectRegion,
  telHref,
} = useContactPage()

const { apiBase } = useApi()
const { contactBody } = useSiteSettings()
const body = computed(() => contactBody.value || '')
const bodyIsHtml = computed(() => Boolean(body.value) && isRichHtml(body.value))
const bodyHtml = computed(() =>
  bodyIsHtml.value ? prepareRichHtml(body.value, apiBase) : '',
)

useScrollReveal(() => [pending.value, contacts.value.length, body.value, bodyIsHtml.value])
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-head" data-reveal>
        <h1>{{ t('contact.title') }}</h1>
        <p>{{ t('contact.desc') }}</p>
      </header>

      <div
        v-if="bodyIsHtml"
        class="about-body contact-intro"
        data-reveal-blocks
        v-html="bodyHtml"
      />
      <div v-else-if="body" class="about-body contact-intro is-plain" data-reveal-blocks>
        <p>{{ body }}</p>
      </div>

      <p v-if="pending && !contacts.length" data-reveal>{{ t('common.loading') }}</p>

      <div v-else class="contact-layout">
        <section
          class="contact-compose"
          aria-labelledby="contact-form-title"
          data-reveal
        >
          <h2 id="contact-form-title" class="section-title">
            {{ t('contact.formTitle') }}
          </h2>
          <p v-if="submitted" class="notice ok">{{ t('contact.success') }}</p>
          <el-form
            v-else
            ref="formRef"
            class="contact-form"
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
        </section>

        <aside
          v-if="contacts.length"
          class="contact-aside"
          aria-labelledby="contact-desk-title"
          data-reveal
        >
          <h2 id="contact-desk-title">{{ t('contact.deskTitle') }}</h2>

          <div v-if="selectedContact" class="desk-now">
            <p class="desk-now-region">{{ selectedContact.region }}</p>
            <p class="desk-now-name">{{ selectedContact.name }}</p>
            <div class="desk-channels">
              <a
                v-if="selectedContact.email"
                class="desk-channel"
                :href="'mailto:' + selectedContact.email"
              >
                <PhEnvelopeSimple :size="16" weight="regular" />
                <span>{{ selectedContact.email }}</span>
              </a>
              <a
                v-if="selectedContact.phone"
                class="desk-channel"
                :href="telHref(selectedContact.phone)"
              >
                <PhPhone :size="16" weight="regular" />
                <span>{{ selectedContact.phone }}</span>
              </a>
            </div>
          </div>

          <div
            v-if="contacts.length > 1"
            class="desk-list"
            role="radiogroup"
            :aria-label="t('contact.region')"
          >
            <button
              v-for="r in contacts"
              :key="r.id"
              type="button"
              class="desk-row"
              :class="{ 'is-active': selectedContact?.id === r.id }"
              role="radio"
              :aria-checked="selectedContact?.id === r.id"
              @click="selectRegion(r.id, r.regionValue)"
            >
              <span class="desk-row-region">{{ r.region }}</span>
              <span class="desk-row-name">{{ r.name }}</span>
              <span v-if="r.email" class="desk-row-mail">{{ r.email }}</span>
            </button>
          </div>

          <p class="desk-hint">{{ t('contact.hint') }}</p>
        </aside>
      </div>
    </div>
  </div>
</template>
