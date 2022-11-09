module.exports = {
  extends: ['jkarczm'],
  parserOptions: {
    project: 'tsconfig.json',
  },
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
  },
};
