import React, { useState, useRef, useEffect } from "react";
import { X, Plus, ChevronDown } from "lucide-react";
import { Tag } from "../types";

interface TagInputProps {
  availableTags: Tag[];
  selectedTagIds: number[];
  onTagsChange: (tagIds: number[]) => void;
  onCreateTag?: (tagName: string) => Promise<Tag>; // Optional callback to create new tag
  placeholder?: string;
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  availableTags,
  selectedTagIds,
  onTagsChange,
  onCreateTag,
  placeholder = "Search or create tags...",
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter available tags based on search term
  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedTagIds.includes(tag.id)
  );

 
  const maxTagsToShow = 20;
  const tagsToShow = searchTerm.trim()
    ? filteredTags
    : filteredTags.slice(0, maxTagsToShow);

  const hasMoreTags = !searchTerm.trim() && filteredTags.length > maxTagsToShow;

  const selectedTags = availableTags.filter((tag) =>
    selectedTagIds.includes(tag.id)
  );

  const exactMatch = availableTags.find(
    (tag) => tag.name.toLowerCase() === searchTerm.toLowerCase()
  );

  const shouldShowCreateOption =
    searchTerm.trim() && !exactMatch && tagsToShow.length === 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTagSelect = (tag: Tag) => {
    if (!selectedTagIds.includes(tag.id)) {
      onTagsChange([...selectedTagIds, tag.id]);
    }
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleTagRemove = (tagId: number) => {
    onTagsChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (newTagName.trim()) {
      try {
        if (onCreateTag) {
          // Use the provided create tag callback
          const newTag = await onCreateTag(newTagName.trim());
          onTagsChange([...selectedTagIds, newTag.id]);
        } else {
          // Fallback: create a temporary tag with negative ID
          const tempId = -Date.now();
          const newTag: Tag = {
            id: tempId,
            name: newTagName.trim(),
          };

          // Add to available tags
          availableTags.push(newTag);
          onTagsChange([...selectedTagIds, tempId]);
        }

        setNewTagName("");
        setSearchTerm("");
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to create tag:", error);
        // Handle error - maybe show a toast
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setNewTagName(value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tagsToShow.length > 0) {
        handleTagSelect(tagsToShow[0]);
      } else if (shouldShowCreateOption) {
        handleCreateTag();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    } else if (
      e.key === "Backspace" &&
      !searchTerm &&
      selectedTags.length > 0
    ) {
      // Remove last selected tag when backspace is pressed on empty input
      handleTagRemove(selectedTags[selectedTags.length - 1].id);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Tags + Input */}
      <div className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
        <div className="flex flex-wrap gap-1 items-center">
          {/* Selected Tags */}
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleTagRemove(tag.id)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
          />

          {/* Dropdown Indicator */}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Filtered Tags */}
          {tagsToShow.length > 0 && (
            <div className="py-1">
              {tagsToShow.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagSelect(tag)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">{tag.name}</span>
                </button>
              ))}

              {/* Show "more tags" indicator when not searching and there are more tags */}
              {hasMoreTags && (
                <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
                  +{filteredTags.length - maxTagsToShow} more tags available.
                  Start typing to search...
                </div>
              )}
            </div>
          )}

          {/* Create New Tag Option */}
          {shouldShowCreateOption && (
            <div className="py-1 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCreateTag}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-blue-600"
              >
                <Plus size={14} />
                <span>Create "{newTagName.trim()}"</span>
              </button>
            </div>
          )}

          {/* No Results */}
          {searchTerm && tagsToShow.length === 0 && !shouldShowCreateOption && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No matching tags found
            </div>
          )}

          {/* Empty State - when no search and no results to show initially */}
          {!searchTerm &&
            tagsToShow.length === 0 &&
            selectedTags.length < availableTags.length && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Start typing to search tags...
              </div>
            )}

          {/* Empty State */}
          {!searchTerm &&
            tagsToShow.length === 0 &&
            selectedTags.length === availableTags.length && (
              <div className="px-3 py-2 text-sm text-gray-500">
                All tags selected
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default TagInput;
