<template>
  <div class="markdown-body" v-html="rendered"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked, type Tokens, type RendererObject } from 'marked'
import hljs from 'highlight.js'

const props = defineProps<{ content: string }>()

const renderer: RendererObject = {
  code({ text, lang }: Tokens.Code) {
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
    const highlighted = hljs.highlight(text, { language }).value
    return `<pre class="hljs-block"><div class="hljs-header"><span class="hljs-lang">${language}</span></div><code class="hljs language-${language}">${highlighted}</code></pre>`
  },

  heading({ tokens, depth }: Tokens.Heading) {
    const text = this.parser.parseInline(tokens)
    return `<h${depth} class="md-h md-h${depth}">${text}</h${depth}>`
  },

  paragraph({ tokens }: Tokens.Paragraph) {
    const text = this.parser.parseInline(tokens)
    return `<p class="md-p">${text}</p>`
  },

  list(token: Tokens.List) {
    const tag = token.ordered ? 'ol' : 'ul'
    const body = token.items.map(item => this.listitem(item)).join('')
    return `<${tag} class="md-list">${body}</${tag}>`
  },

  listitem(item: Tokens.ListItem) {
    const text = this.parser.parse(item.tokens)
    return `<li class="md-li">${text}</li>`
  },

  blockquote({ tokens }: Tokens.Blockquote) {
    const body = this.parser.parse(tokens)
    return `<blockquote class="md-blockquote">${body}</blockquote>`
  },

  table(token: Tokens.Table) {
    const headerCells = token.header.map(cell => {
      const content = this.parser.parseInline(cell.tokens)
      const align = cell.align ? ` style="text-align:${cell.align}"` : ''
      return `<th${align}>${content}</th>`
    }).join('')
    const rows = token.rows.map(row => {
      const cells = row.map(cell => {
        const content = this.parser.parseInline(cell.tokens)
        const align = cell.align ? ` style="text-align:${cell.align}"` : ''
        return `<td${align}>${content}</td>`
      }).join('')
      return `<tr>${cells}</tr>`
    }).join('')
    return `<div class="md-table-wrap"><table class="md-table"><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table></div>`
  },

  codespan({ text }: Tokens.Codespan) {
    return `<code class="md-codespan">${text}</code>`
  },

  strong({ tokens }: Tokens.Strong) {
    const text = this.parser.parseInline(tokens)
    return `<strong class="md-strong">${text}</strong>`
  },

  em({ tokens }: Tokens.Em) {
    const text = this.parser.parseInline(tokens)
    return `<em class="md-em">${text}</em>`
  },

  link({ href, tokens }: Tokens.Link) {
    const text = this.parser.parseInline(tokens)
    return `<a class="md-link" href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
  },

  hr() {
    return '<hr class="md-hr">'
  },
}

marked.use({ breaks: true, gfm: true, renderer })

const rendered = computed(() => marked.parse(props.content) as string)
</script>
