import type { Schema, Struct } from '@strapi/strapi';

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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'content.timeline-item': ContentTimelineItem;
    }
  }
}
