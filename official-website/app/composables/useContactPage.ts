import type { FormInstance, FormRules } from 'element-plus'
import { useCachedAsyncData } from '~/composables/useDataCache'
import { cleanInput, normalizeSubmitError } from '~/utils/form'

/** 联系我们页逻辑 */
export function useContactPage() {
  const { t, locale } = useI18n()
  const { getContacts, createMessage } = useApi()
  const { settings, siteName } = useSiteSettings()

  usePageSeoMeta('contact', {
    title: () => t('contact.seo.title'),
    description: () => t('contact.seo.desc'),
  })

  const { data: contactsRaw, pending } = useCachedAsyncData(
    'contacts',
    () => getContacts(),
  )

  const contacts = computed(() =>
    (contactsRaw.value || []).map((c) => ({
      id: c.id,
      region: locale.value === 'en' ? c.regionEn : c.regionZh,
      regionValue: c.regionEn || c.regionZh,
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
    })),
  )

  const siteContactFallback = computed(() => {
    const s = settings.value
    if (!s?.contactEmail && !s?.contactPhone) return null
    return {
      id: 0,
      region: t('contact.general'),
      regionValue: t('contact.general'),
      name: siteName.value || '',
      email: s.contactEmail || '',
      phone: s.contactPhone || '',
    }
  })

  const displayContacts = computed(() => {
    if (contacts.value.length) return contacts.value
    return siteContactFallback.value ? [siteContactFallback.value] : []
  })

  const formRef = ref<FormInstance>()
  const form = reactive({
    name: '',
    email: '',
    region: '',
    message: '',
  })

  const activeRegionId = ref<number | null>(null)

  watch(
    displayContacts,
    (list) => {
      const first = list[0]
      if (!first) return
      if (!form.region) form.region = first.regionValue
      if (activeRegionId.value == null) activeRegionId.value = first.id
    },
    { immediate: true },
  )

  const submitted = ref(false)
  const submitting = ref(false)
  const submitError = ref('')

  const rules = computed<FormRules>(() => ({
    name: [{ required: true, message: t('contact.name'), trigger: 'blur' }],
    email: [
      { required: true, message: t('contact.email'), trigger: 'blur' },
      { type: 'email', message: t('contact.email'), trigger: ['blur', 'change'] },
    ],
    message: [{ required: true, message: t('contact.message'), trigger: 'blur' }],
  }))

  function buildPayload() {
    return {
      name: cleanInput(form.name),
      email: cleanInput(form.email),
      region: form.region ? cleanInput(form.region) : undefined,
      content: cleanInput(form.message),
    }
  }

  function resetForm() {
    const defaultRegion = displayContacts.value[0]?.regionValue || ''
    form.name = ''
    form.email = ''
    form.message = ''
    form.region = defaultRegion
    formRef.value?.resetFields()
  }

  async function onSubmit() {
    if (submitting.value) return
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    submitError.value = ''
    try {
      await createMessage(buildPayload())
      submitted.value = true
      resetForm()
    } catch (err: unknown) {
      submitError.value = normalizeSubmitError(err)
    } finally {
      submitting.value = false
    }
  }

  function selectRegion(id: number, regionValue: string) {
    activeRegionId.value = id
    form.region = regionValue
  }

  return {
    t,
    contacts: displayContacts,
    formRef,
    form,
    submitted,
    submitting,
    submitError,
    rules,
    onSubmit,
    activeRegionId,
    selectRegion,
    pending,
  }
}

export const CONTACT_PAGE_KEY = 'contact-page'

export function provideContactPage(page: ReturnType<typeof useContactPage>) {
  provide(CONTACT_PAGE_KEY, page)
}

export function useInjectedContactPage() {
  const page = inject<ReturnType<typeof useContactPage>>(CONTACT_PAGE_KEY)
  if (!page) {
    throw new Error('Contact page missing — call useContactPage in the page shell')
  }
  return page
}
