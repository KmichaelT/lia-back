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

  // Use the query engine here so the derived values are saved immediately after
  // media relations have been connected by Strapi.
  await strapi.db.query(CHILD_UID).update({
    where: { id },
    data: counts,
  });
};

export default {
  async afterCreate(event) {
    await refreshMediaCounts(event.result?.id);
  },

  async afterUpdate(event) {
    const changedFields = Object.keys(event.params?.data ?? {});
    const onlyCountsChanged =
      changedFields.length > 0 &&
      changedFields.every((field) => field === 'imageCount' || field === 'videoCount');

    if (!onlyCountsChanged) {
      await refreshMediaCounts(event.result?.id);
    }
  },
};

