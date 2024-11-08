<script lang="ts" setup>
import { numeric, required } from "@vuelidate/validators";
import useVuelidate from "@vuelidate/core";
import { LineItem } from "../../types/invoice-types";
import TextField from "./elements/TextField.vue";
import TextareaField from "./elements/TextareaField.vue";
import PriceField from "./elements/PriceField.vue";
import TwoColumn from "../layout/TwoColumn.vue";
import NumberField from "./elements/NumberField.vue";
import { formatCurrency } from "../../util/format-currency";
import { computed } from "vue";
import LineItemUnitSelectField from "./elements/LineItemUnitSelectField.vue";

const props = defineProps<{
  formData: LineItem;
}>();
const emit = defineEmits<{
  (e: "update", formData: LineItem, validation: any): void;
}>();
const rules = {
  quantity: { required, numeric },
  title: { required },
  description: { required },
  unit: { required },
  unitPrice: { required, numeric },
  unitTotal: { required, numeric },
};
const v$ = useVuelidate(rules, props.formData);
</script>

<template>
  <q-form @submit.prevent class="q-gutter-md">
    <TextField
      label="Title*"
      hint="The title of the position."
      :validation="v$"
      property="title"
      :value="formData.title"
      @change="(value: string) => {
        formData.title = value
        emit('update', props.formData, v$)
      }"
    />
    <TextareaField
      label="Description*"
      hint="The description of the position."
      :validation="v$"
      property="description"
      :value="formData.description"
      @change="(value: string) => {
        formData.description = value
        emit('update', props.formData, v$)
      }"
    />

    <TwoColumn>
      <template v-slot:leftColumn>
        <NumberField
          class="q-mb-sm"
          label="Quantity*"
          hint="The quantity of the position."
          :validation="v$"
          property="quantity"
          :value="formData.quantity"
          @change="(value: number) => {
            formData.quantity = value
            formData.unitTotal = formData.unitPrice * formData.quantity
            emit('update', props.formData, v$)
          }"
        />
        <PriceField
          label="Unit price*"
          hint="The unit price of the position."
          :validation="v$"
          property="unitPrice"
          :value="formData.unitPrice"
          @change="(value: number) => {
            formData.unitPrice = value
            formData.unitTotal = formData.unitPrice * formData.quantity
            emit('update', props.formData, v$)
          }"
        />
      </template>
      <template v-slot:rightColumn>
        <LineItemUnitSelectField
          class="q-mb-lg"
          label="Unit*"
          hint="The unit of the position."
          :validation="v$"
          property="unit"
          :value="formData.unit"
          @change="(value: string) => {
            formData.unit = value
            emit('update', props.formData, v$)
          }"
        />
        <q-badge
          square
          class="text-h6"
          color="dark"
          :label="'Position total: ' + formatCurrency(formData.unitTotal)"
        />
      </template>
    </TwoColumn>
  </q-form>
</template>
