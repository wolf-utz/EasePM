<script lang="ts" setup></script>

<template>
  <div class="row">
    <div class="col-6 q-px-sm">
      <slot name="leftColumn"></slot>
    </div>
    <div class="col-6 q-px-sm">
      <slot name="rightColumn"></slot>
    </div>
  </div>
</template>
