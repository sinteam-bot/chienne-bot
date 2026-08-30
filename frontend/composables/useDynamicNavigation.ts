import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { NavigationSection, ChannelItem } from './useAppState.ts';

export interface RouteNavigationItem extends ChannelItem {
  order: number;
}

export function useDynamicNavigation() {
  const router = useRouter();

  const SECTION_CONFIG: Record<string, { title: string; icon: string; order: number }> = {
    bot: { title: 'Bot', icon: '🐕', order: 1 },
    modules: { title: 'Modules', icon: '🧩', order: 2 },
    games: { title: 'Games', icon: '🎮', order: 3 }
  };

  const dynamicSections = computed<NavigationSection[]>(() => {
    const routes = router.getRoutes();
    const sectionMap = new Map<string, RouteNavigationItem[]>();

    // Initialiser les sections par défaut
    for (const key of Object.keys(SECTION_CONFIG)) {
      sectionMap.set(key, []);
    }

    // Parcourir toutes les routes et extraire celles ayant une section dans definePageMeta
    for (const r of routes) {
      const meta = r.meta || {};
      const section = (meta.section as string) || undefined;
      const isHidden = Boolean(meta.hidden);

      // Si la route a une section déclarée et n'est pas cachée
      if (section && !isHidden && (meta.title || meta.name)) {
        if (!sectionMap.has(section)) {
          sectionMap.set(section, []);
        }

        let normalizedPath = r.path;
        const { guild } = useAppState();
        const activeGuildId = guild.value?.id || 'default';

        // Remplacer le paramètre dynamique :guild ou :guild() par le guild_id actuel
        normalizedPath = normalizedPath.replace(/:guild(\(\))?/g, activeGuildId);

        // Si la route est le conteneur /panel/{guild}/config, rediriger vers general par défaut
        if (normalizedPath.endsWith('/config')) {
          normalizedPath = `${normalizedPath}/general`;
        }

        // Ignorer les routes contenant des paramètres non résolus (ex: :channelId, :feature)
        if (normalizedPath.includes(':')) {
          continue;
        }

        const item: RouteNavigationItem = {
          id: (r.name as string) || normalizedPath.replace(/^\//, '').replace(/\//g, '-'),
          name: (meta.title as string) || normalizedPath,
          icon: (meta.icon as string) || '📄',
          routePath: normalizedPath,
          section: section as any,
          topic: (meta.description as string) || (meta.topic as string) || '',
          badge: (meta.badge as string) || undefined,
          order: (meta.order as number) ?? 99
        };

        const existingList = sectionMap.get(section)!;
        if (!existingList.some(x => x.routePath === item.routePath)) {
          existingList.push(item);
        }
      }
    }

    // Construire le tableau ordonné de sections
    const result: NavigationSection[] = [];

    for (const [secId, items] of sectionMap.entries()) {
      // Trier les items selon order croissant puis nom alphabétique
      items.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name, 'fr');
      });

      const secConf = SECTION_CONFIG[secId] || { title: secId, icon: '📁', order: 99 };

      result.push({
        id: secId as any,
        title: secConf.title,
        icon: secConf.icon,
        badge: secId !== 'bot' && items.length > 0 ? items.length.toString() : undefined,
        items,
        collapsed: false
      });
    }

    // Trier les sections par ordre de priorité
    result.sort((a, b) => {
      const orderA = SECTION_CONFIG[a.id]?.order ?? 99;
      const orderB = SECTION_CONFIG[b.id]?.order ?? 99;
      return orderA - orderB;
    });

    return result;
  });

  return {
    dynamicSections
  };
}
