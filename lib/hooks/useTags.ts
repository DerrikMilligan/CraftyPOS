import { Tag } from '@prisma/client';
import useSWR from 'swr';

import { getFetcher, jsonDelete, jsonPost } from '../fetching';

const endpoint = '/api/tag';

export const useTags = () => {
  const {
    error,
    mutate,
    data: tags,
  } = useSWR<Tag[]>(endpoint, getFetcher());

  const addTag = async (tag: Tag) => {
    if (tags === undefined)
      throw new Error('Attempting to add tag before tags resolved');
    
    let newTag = null;

    await mutate(
      async () => {
        try {
          newTag = await jsonPost(endpoint, tag);
          // showNotification({ color: 'green', title: 'Created!', message: 'Tag added successfully' });
          return [ newTag, ...tags ];
        } catch (e) {
          // showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong when saving the tag! Try again later.' });
        }

        return tags;
      },
      {
        optimisticData: [ tag, ...tags ],
      },
    );
    
    return newTag;
  };

  const deleteTag = async (tag: Tag) => {
    if (tags === undefined)
      throw new Error('Attempting to delete tag before tags resolved');

    const updatedTags = tags.filter((v) => v.id !== tag.id);

    await mutate(
      async () => {
        try {
          const response = await jsonDelete(`${endpoint}/${tag.id}`, tag);
          
          if (response.success === false)
            throw new Error('Bubble up the error');
          
          // showNotification({ color: 'green', title: 'Removed!', message: 'Tag removed successfully' });
          return updatedTags;
        } catch (e) {
          // showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong with removing the tag! Try again later.' });
          console.error(e);
        }

        return tags;
      },
      {
        optimisticData: updatedTags,
      },
    );
  }

  return {
    addTag,
    deleteTag,
    tags,
    isLoading: !error && tags === undefined,
    isError  : error,
  };
}

export default useTags;
