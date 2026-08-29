const CHILD_UID = 'api::child.child';

type MediaFile = {
  mime?: string | null;
};

const countMedia = (media: MediaFile[] = []) => ({
  imageCount: media.filter((file) => file.mime?.startsWith('image/')).length,
  videoCount: media.filter((file) => file.mime?.startsWith('video/')).length,
});

const refreshMediaCounts = async (id?: number | string) => {
  if (!id) return;

  const child = await strapi.db.query(CHILD_UID).findOne({
    where: { id },
    populate: {
      images: {
        select: ['mime'],
      },
    },
  });

  if (!child) return;

  const counts = countMedia(child.images as MediaFile[] | undefined);

  if (child.imageCount === counts.imageCount && child.videoCount === counts.videoCount) {
    return;
  }

  // Write the derived values directly. Going back through the query engine from
  // an afterUpdate hook would trigger the same lifecycle recursively.
  await strapi.db.connection('children').where({ id }).update({
    image_count: counts.imageCount,
    video_count: counts.videoCount,
  });
};

export default {
  async afterCreate(event) {
    await refreshMediaCounts(event.result?.id);
  },

  async afterUpdate(event) {
    await refreshMediaCounts(event.result?.id);
  },
};
