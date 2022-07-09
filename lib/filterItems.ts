// Update the items based upon what the user has typed
import { AutocompleteItemProps } from '../components/AutocompleteItem';

import fuzzysort from 'fuzzysort';
import levenshtein from 'js-levenshtein';

export const filterItems = (search: string, autocompleteItem: AutocompleteItemProps): boolean => {
  // If we don't even have a search param then just leave the item in the list
  if (search.trim().length <= 0)
    return true;

  const searchLower = search.toLowerCase();

  // If the name contains the whole string then heck yeah just return yes
  if (autocompleteItem.item.name.toLowerCase().includes(searchLower))
    return true;

  // If we are part of a tag exactly then return true
  for (const tag of autocompleteItem.item.Tags)
    if (tag.name.toLowerCase().includes(searchLower))
      return true;

  // If we are part of a persons name then return true as well
  if (
    autocompleteItem.item.Vendor.firstName.toLowerCase().includes(searchLower) ||
    autocompleteItem.item.Vendor.lastName.toLowerCase().includes(searchLower)
  )
    return true;

  // Attempt to do a fuzzy search
  const fuzzy = fuzzysort.go(searchLower, [ autocompleteItem.item.name, ...autocompleteItem.item.Tags.map(t => t.name) ], { threshold: -30000 });
  if (fuzzy.length > 0)
    return true;

  // Otherwise we'll try and compute some levenshtein magic
  const lev = levenshtein(search.toLowerCase(), autocompleteItem.item.name.toLowerCase());
  const ratio = (lev) / (Math.max(search.length, autocompleteItem.item.name.length));

  // Here's our magic difference ratio for determining if the word is close enough
  return ratio <= .4;
};
