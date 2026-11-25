// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  stylistic: {
    indent: 2,
  },
  typescript: true,
  vue: {
    overrides: {
      // Attributes on components and HTML elements: static attributes first,
      // then dynamic bindings, each group sorted alphabetically.
      // Vue directives keep their style-guide positions around them.
      'vue/attributes-order': [
        'error',
        {
          alphabetical: true,
          order: [
            'DEFINITION', // is, v-is
            'LIST_RENDERING', // v-for
            'CONDITIONALS', // v-if, v-else-if, v-else, v-show, v-cloak
            'RENDER_MODIFIERS', // v-once, v-pre
            ['UNIQUE', 'SLOT'], // key, ref, v-slot, slot
            'TWO_WAY_BINDING', // v-model
            'OTHER_DIRECTIVES', // custom directives
            ['ATTR_STATIC', 'ATTR_SHORTHAND_BOOL', 'GLOBAL'], // class="a", disabled, id="b"
            'ATTR_DYNAMIC', // :prop, v-bind:prop
            'EVENTS', // @event, v-on:event
            'CONTENT', // v-text, v-html
          ],
        },
      ],
    },
  },
})
