import type { Schema, Struct } from '@strapi/strapi';

export interface ContentBibleVerse extends Struct.ComponentSchema {
  collectionName: 'components_content_bible_verses';
  info: {
    description: 'Inspirational quote or bible verse section';
    displayName: 'Bible Verse';
    icon: 'book';
  };
  attributes: {
    attribution: Schema.Attribute.String;
    backgroundImage: Schema.Attribute.Media<'images'>;
    quote: Schema.Attribute.RichText & Schema.Attribute.Required;
  };
}

export interface ContentNewsletterSection extends Struct.ComponentSchema {
  collectionName: 'components_content_newsletter_sections';
  info: {
    description: 'Newsletter signup section';
    displayName: 'Newsletter Section';
    icon: 'envelope';
  };
  attributes: {
    buttonText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Subscribe'>;
    description: Schema.Attribute.Text;
    formActionUrl: Schema.Attribute.String;
    placeholderText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Enter your email'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContentTimelineItem extends Struct.ComponentSchema {
  collectionName: 'components_content_timeline_items';
  info: {
    description: 'Individual timeline entry';
    displayName: 'Timeline Item';
    icon: 'clock';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    endYear: Schema.Attribute.String;
    startYear: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ViewersCauseViewer extends Struct.ComponentSchema {
  collectionName: 'components_viewers_cause_viewers';
  info: {
    description: 'Display causes in various layouts';
    displayName: 'Cause Viewer';
    icon: 'heart';
  };
  attributes: {
    causes: Schema.Attribute.Relation<'oneToMany', 'api::cause.cause'>;
    maxItems: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
        },
        number
      > &
      Schema.Attribute.DefaultTo<5>;
    sectionDescription: Schema.Attribute.Text;
    sectionHeader: Schema.Attribute.String;
    sectionTitle: Schema.Attribute.String;
  };
}

export interface ViewersEventViewer extends Struct.ComponentSchema {
  collectionName: 'components_viewers_event_viewers';
  info: {
    description: 'Display events in various layouts';
    displayName: 'Event Viewer';
    icon: 'calendar';
  };
  attributes: {
    events: Schema.Attribute.Relation<'oneToMany', 'api::event.event'>;
    maxItems: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
        },
        number
      > &
      Schema.Attribute.DefaultTo<4>;
    sectionDescription: Schema.Attribute.Text;
    sectionHeader: Schema.Attribute.String;
    sectionTitle: Schema.Attribute.String;
  };
}

export interface ViewersServiceViewer extends Struct.ComponentSchema {
  collectionName: 'components_viewers_service_viewers';
  info: {
    description: 'Display services in various layouts';
    displayName: 'Service Viewer';
    icon: 'briefcase';
  };
  attributes: {
    sectionDescription: Schema.Attribute.Text;
    sectionHeader: Schema.Attribute.String;
    sectionTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'What we do'>;
    services: Schema.Attribute.Relation<'oneToMany', 'api::service.service'>;
  };
}

export interface ViewersStatsViewer extends Struct.ComponentSchema {
  collectionName: 'components_viewers_stats_viewers';
  info: {
    description: 'Display statistics in various layouts';
    displayName: 'Stats Viewer';
    icon: 'chart-line';
  };
  attributes: {
    maxItems: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 6;
        },
        number
      > &
      Schema.Attribute.DefaultTo<6>;
    sectionTitle: Schema.Attribute.String;
    stats: Schema.Attribute.Relation<'oneToMany', 'api::stat.stat'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'content.bible-verse': ContentBibleVerse;
      'content.newsletter-section': ContentNewsletterSection;
      'content.timeline-item': ContentTimelineItem;
      'viewers.cause-viewer': ViewersCauseViewer;
      'viewers.event-viewer': ViewersEventViewer;
      'viewers.service-viewer': ViewersServiceViewer;
      'viewers.stats-viewer': ViewersStatsViewer;
    }
  }
}
