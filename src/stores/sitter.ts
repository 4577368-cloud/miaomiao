import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserInfo } from './user';

// Sitter Store
export const useSitterStore = defineStore('sitter', () => {
  // Empty by default - no fake sitters
  const availableSitters = ref<UserInfo[]>([]);

  // Function to register a sitter (simulating coming online)
  const addSitter = (sitter: UserInfo) => {
    if (!availableSitters.value.find(s => s.id === sitter.id)) {
      availableSitters.value.push(sitter);
    }
  };

  return {
    availableSitters,
    addSitter
  };
});
