<template>
  <div class="view-panel">
    <!-- En-tête de la Vue -->
    <div class="module-view-header">
      <div class="header-main">
        <div class="header-icon-wrapper">
          <span class="header-icon">🎨</span>
        </div>
        <div class="header-titles">
          <h2 class="header-title">Moteur de Templates Discord</h2>
          <p class="header-description">
            Créez, testez et prévisualisez des messages et embeds Discord enrichis avec variables (<code>&#123;&#123; user.name &#125;&#125;</code>),
            conditions (<code>&#123;% if %&#125;</code>), boucles de classement (<code>&#123;% for %&#125;</code>) et filtres en temps réel.
          </p>
        </div>
      </div>
    </div>

    <!-- Scroller avec l'éditeur de templates -->
    <div class="module-view-scroller" style="padding-top: 16px;">
      <DiscordTemplateEditor />
    </div>
  </div>
</template>

<script setup lang="ts">
import DiscordTemplateEditor from '~/components/common/DiscordTemplateEditor.vue';
</script>

<style scoped>
.module-view-header {
  padding: 16px 24px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: rgba(88, 101, 242, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(88, 101, 242, 0.3);
}

.header-icon {
  font-size: 24px;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--header-primary);
}

.header-description {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
}

.header-description code {
  font-family: var(--font-code);
  color: var(--brand, #5865f2);
  background: var(--bg-tertiary);
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
