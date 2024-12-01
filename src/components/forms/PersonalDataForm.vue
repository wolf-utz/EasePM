<script lang="ts" setup>
import { reactive } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";
import { PersonalFormData } from "../../types/forms/personal-data-form-types";
import TextField from "./elements/TextField.vue";
import TwoColumn from "../layout/TwoColumn.vue";
import { useQuasar } from "quasar";

const props = defineProps<{ formData: PersonalFormData }>();
const emit = defineEmits<{
  (e: "submit", formData: PersonalFormData): void;
}>();
const $q = useQuasar();
const formData = reactive<PersonalFormData>(props.formData);
const rules = {
  firstName: { required },
  lastName: { required },
  address: { required },
  city: { required },
  zip: { required },
  country: { required },
  email: { required, email },
  banking: {
    iban: { required },
    bic: { required },
    bank: { required },
  },
  taxId: {},
  taxNumber: { required },
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
    <h2 class="text-h5">Personal data</h2>

    <TwoColumn>
      <template v-slot:leftColumn>
        <TextField
          label="Your first name*"
          hint="First Name."
          :validation="v$"
          property="firstName"
          :value="formData.firstName"
          @change="(value: string) => (formData.firstName = value)"
        />
      </template>
      <template v-slot:rightColumn>
        <TextField
          label="Your last name*"
          hint="Last Name."
          :validation="v$"
          property="lastName"
          :value="formData.lastName"
          @change="(value: string) => (formData.lastName = value)"
        />
      </template>
    </TwoColumn>

    <TextField
      label="Your address*"
      hint="Street and number."
      :validation="v$"
      property="address"
      :value="formData.address"
      @change="(value: string) => (formData.address = value)"
    />

    <TwoColumn>
      <template v-slot:leftColumn>
        <TextField
          label="Your city name*"
          hint="City name."
          :validation="v$"
          property="city"
          :value="formData.city"
          @change="(value: string) => (formData.city = value)"
        />
      </template>
      <template v-slot:rightColumn>
        <TextField
          label="Your ZIP*"
          hint="ZIP."
          :validation="v$"
          property="zip"
          :value="formData.zip"
          @change="(value: string) => (formData.zip = value)"
        />
      </template>
    </TwoColumn>

    <TextField
      label="Your email*"
      hint="Email."
      :validation="v$"
      property="email"
      :value="formData.email"
      @change="(value: string) => (formData.email = value)"
    />

    <h2 class="text-h5">Banking</h2>

    <div :class="{ error: v$.banking.bank.$errors.length }">
      <q-input
        filled
        v-model="formData.banking.bank"
        label="Your bank name *"
        hint="Bank name"
        lazy-rules
        dark
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.banking.bank.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>
    <div :class="{ error: v$.banking.iban.$errors.length }">
      <q-input
        filled
        v-model="formData.banking.iban"
        label="Your bank IBAN *"
        hint="IBAN"
        lazy-rules
        dark
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.banking.iban.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>
    <div :class="{ error: v$.banking.bic.$errors.length }">
      <q-input
        filled
        v-model="formData.banking.bic"
        label="Your bank BIC *"
        hint="BIC"
        lazy-rules
        dark
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.banking.bic.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>

    <h2 class="text-h5">Tax</h2>

    <TextField
      label="Your TAX ID"
      hint="TAX ID."
      :validation="v$"
      property="taxId"
      :value="formData.taxId"
      @change="(value: string) => (formData.taxId = value)"
    />
    <TextField
      label="Your TAX number"
      hint="TAX number."
      :validation="v$"
      property="taxNumber"
      :value="formData.taxNumber"
      @change="(value: string) => (formData.taxNumber = value)"
    />

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn icon="save" type="submit" color="primary" />
    </q-page-sticky>
  </q-form>
</template>
