<script lang="ts" setup>
import { ref } from "vue";
import { LineItem } from "../../../types/invoice-types";
import LineItemPseudoForm from "../LineItemPseudoForm.vue";
import { Unit } from "../../../types/enums/line-item-unit";
import { formatCurrency } from "../../../util/format-currency";

const props = defineProps<{
  lineItems: LineItem[];
}>();
const emit = defineEmits<{
  (e: "update", lineItems: LineItem[]): void;
}>();
const lineItems = ref<LineItem[]>(props.lineItems || []);
function onAddLineItem(): void {
  const newLineItem: LineItem = {
    quantity: 1,
    title: "",
    description: "",
    unit: Unit.PER_PIECE,
    unitPrice: 0,
    unitTotal: 0,
  };
  lineItems.value.push(newLineItem);
}
function onUpdateLineItem(): void {
  emit("update", lineItems.value);
}
function removeLineItem(index: number): void {
  lineItems.value.splice(index, 1);
  emit("update", lineItems.value);
}
const positionTotal = ref<number>(0);
</script>

<template>
  <q-btn
    color="dark"
    icon="add"
    label="Add new position"
    @click="onAddLineItem"
  />

  <q-banner v-if="lineItems.length === 0" class="bg-dark q-pb-md">
    <template v-slot:avatar>
      <q-icon name="error" color="negative" />
    </template>
    There are no positions yet. Please add one or more.
    <template v-slot:action> </template>
  </q-banner>

  <q-list
    v-else
    dark
    bordered
    class="rounded-borders"
    v-if="lineItems.length > 0"
  >
    <q-expansion-item
      v-for="(lineItem, i) in lineItems"
      :key="i"
      :model-value="true"
      expand-separator
      icon="attach_money"
      :label="lineItem.title || 'New position'"
      :caption="formatCurrency(lineItem.unitTotal)"
    >
      <q-card dark>
        <q-card-section>
          <div class="row justify-end">
            <q-btn
              round
              color="negative"
              icon="delete"
              size="sm"
              class="q-mb-md"
              title="Remove position"
              @click="removeLineItem(i)"
            />
          </div>

          <LineItemPseudoForm
            :form-data="lineItem"
            v-on:change="onUpdateLineItem"
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-list>
</template>
