<script lang="ts" setup>
import { reactive } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";
import { Customer } from "../../types/forms/customer-types";
import TextField from "./elements/TextField.vue";
import TwoColumn from "../layout/TwoColumn.vue";
import { useQuasar } from "quasar";

const props = defineProps<{
  formData: Customer;
}>();
const emit = defineEmits<{
  (e: "submit", formData: Customer): void;
}>();

const formData = reactive<Customer>(props.formData);
const $q = useQuasar();
const rules = {
  _id: {},
  customerNumber: {},
  company: { },
  firstName: { required },
  lastName: { required },
  email: { required, email },
  address: { required },
  city: { required },
  zip: { required },
  country: { required },
};
const v$ = useVuelidate(rules, formData);

function onSubmit(): void {
  v$.value.$touch();
  if (!v$.value.$invalid) {
    emit("submit", JSON.parse(JSON.stringify(props.formData)));
    return;
  }

  $q.notify({
    progress: true,
    type: "negative",
    timeout: 1500,
    position: "top",
    message: "The submited data is not valid. Please check the form.",
  });
}
</script>

<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <TwoColumn>
      <template v-slot:leftColumn>
        <TextField
          label="First name*"
          hint="First Name."
          :validation="v$"
          property="firstName"
          :value="formData.firstName"
          @change="(value: string) => (formData.firstName = value)"
        />
      </template>
      <template v-slot:rightColumn>
        <TextField
          label="Last name*"
          hint="Last Name."
          :validation="v$"
          property="lastName"
          :value="formData.lastName"
          @change="(value: string) => (formData.lastName = value)"
        />
      </template>
    </TwoColumn>

    <TextField
      label="Company (Optional)"
      hint="Company"
      :validation="v$"
      property="company"
      :value="formData.company || ''"
      @change="(value: string) => (formData.company = value)"
    />

    <TextField
      label="Email*"
      hint="Email."
      :validation="v$"
      property="email"
      :value="formData.email"
      @change="(value: string) => (formData.email = value)"
    />

    <TextField
      label="Address*"
      hint="Street and number."
      :validation="v$"
      property="address"
      :value="formData.address"
      @change="(value: string) => (formData.address = value)"
    />

    <TwoColumn>
      <template v-slot:leftColumn>
        <TextField
          label="city name*"
          hint="City name."
          :validation="v$"
          property="city"
          :value="formData.city"
          @change="(value: string) => (formData.city = value)"
        />
      </template>
      <template v-slot:rightColumn>
        <TextField
          label="ZIP*"
          hint="ZIP."
          :validation="v$"
          property="zip"
          :value="formData.zip"
          @change="(value: string) => (formData.zip = value)"
        />
      </template>
    </TwoColumn>

    <TextField
      label="Cuntry*"
      hint="Country."
      :validation="v$"
      property="country"
      :value="formData.country"
      @change="(value: string) => (formData.country = value)"
    />

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="save"
        type="submit"
        color="primary"
        title="Save record"
      />
    </q-page-sticky>
  </q-form>
</template>
