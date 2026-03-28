"use client";

import { useState, useRef, useEffect } from "react";
import {
  Type,
  Image as ImageIcon,
  Link as LinkIcon,
  Code as CodeIcon,
  Smile,
  Send,
  X,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import useCreatePost from "@/hooks/use-create-post";
import { motion, AnimatePresence } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { LANGUAGES } from "@/constants/languages";
import { EMOJIS } from "@/constants/emojis";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";

type PostType = "text" | "image" | "link" | "code";

interface PostComposerProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function PostComposer({
  onSuccess,
  isModal = false,
}: PostComposerProps) {
  const { user } = useUser();
  const [type, setType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [secondaryInput, setSecondaryInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { mutate: createPost, isPending } = useCreatePost();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const MAX_LENGTH = type === "code" ? 2000 : 500;

  useEffect(() => {
    setSecondaryInput("");
    setShowEmojiPicker(false);
  }, [type]);

  useEffect(() => {
    if (type === "code") {
      setSecondaryInput("javascript");
    }
  }, [type]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    let finalContent = content;
    let finalLink = null;
    let mediaType = null;

    setIsUploading(true);

    try {
      if (type === "image" && selectedFile) {
        const blob = await upload(selectedFile.name, selectedFile, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });

        finalLink = blob.url;
        mediaType = selectedFile.type.startsWith("image/gif") ? "gif" : "image";
      } else if (type === "image" || type === "link") {
        let url = secondaryInput.trim();
        if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
          url = `https://${url}`;
        }
        finalLink = url;
      } else if (type === "code") {
        finalLink = `code:${secondaryInput}`;
      }

      createPost(
        { content: finalContent, link: finalLink, media_type: mediaType },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({
              queryKey: ["user-posts", user?.id],
            });
            setContent("");
            setSecondaryInput("");
            setType("text");
            removeFile();
            if (onSuccess) onSuccess();
          },
          onSettled: () => {
            setIsUploading(false);
          },
        },
      );
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
      setIsUploading(false);
    }
  };

  const addEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newText =
        content.substring(0, start) + emoji + content.substring(end);
      setContent(newText);
      setShowEmojiPicker(false);
      // Set selection after a tick
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            start + emoji.length,
            start + emoji.length,
          );
        }
      }, 0);
    } else {
      setContent(content + emoji);
      setShowEmojiPicker(false);
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case "image":
        return "Write a caption for your image...";
      case "link":
        return "What's this link about?";
      case "code":
        return "Paste your code snippet here...";
      default:
        return "May the force be with you...";
    }
  };

  return (
    <div
      className={`flex flex-col gap-4 ${isModal ? "" : "bg-card border border-border/50 rounded-xl p-6 shadow-sm"}`}
    >
      <div className="flex flex-col gap-4">
        <div className="relative group">
          <Textarea
            ref={textareaRef}
            placeholder={getPlaceholder()}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`min-h-[120px] max-h-[400px] resize-none bg-transparent border-none focus-visible:ring-0 p-2 text-lg placeholder:text-muted-foreground/50 overflow-y-auto ${
              type === "code"
                ? "font-mono text-sm bg-muted/20 p-4 rounded-lg"
                : ""
            }`}
            disabled={isPending}
          />

          <div className="absolute bottom-2 left-0 flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-5 h-5" />
              </Button>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bottom-full left-0 mb-2 p-2 bg-card border rounded-xl shadow-xl z-50 grid grid-cols-4 gap-1 w-[160px]"
                  >
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="text-xl p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="absolute bottom-2 right-0">
            <span
              className={`text-[10px] px-2 font-medium ${content.length > MAX_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
            >
              {content.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>

        {/* Secondary Input Based on Type */}
        <AnimatePresence mode="wait">
          {type !== "text" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {type === "image" && (
                <div className="flex flex-col gap-3">
                  <Input
                    type="file"
                    accept="image/*,.gif"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  {!previewUrl ? (
                    <Button
                      variant="outline"
                      className="w-full border-dashed h-24 flex flex-col gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-6 h-6" />
                      <span>Click to upload image or GIF</span>
                    </Button>
                  ) : (
                    <div className="relative group rounded-lg overflow-hidden border">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto max-h-[300px] object-cover"
                      />
                      <button
                        onClick={removeFile}
                        className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-destructive hover:text-white rounded-full transition-all shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      OR
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                  <Input
                    placeholder="Paste image URL (e.g., https://...) "
                    value={secondaryInput}
                    onChange={(e) => setSecondaryInput(e.target.value)}
                    className="bg-muted/30 border-dashed"
                    disabled={!!previewUrl}
                  />
                </div>
              )}
              {type === "link" && (
                <Input
                  placeholder="Paste URL (e.g., https://...) "
                  value={secondaryInput}
                  onChange={(e) => setSecondaryInput(e.target.value)}
                  className="bg-muted/30 border-dashed"
                />
              )}
              {type === "code" && (
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSecondaryInput(lang)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
                        secondaryInput === lang
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/50 border-transparent text-muted-foreground hover:border-border"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Type Selector */}
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
          {[
            { id: "text", icon: Type, label: "Text" },
            { id: "image", icon: ImageIcon, label: "Image" },
            { id: "link", icon: LinkIcon, label: "Link" },
            { id: "code", icon: CodeIcon, label: "Code" },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = type === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setType(item.id as PostType)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-background shadow-xs text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {/* <span className="hidden sm:inline">{item.label}</span> */}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground italic">
          {type === "code"
            ? "Code snippets look best in dark mode 🛸"
            : "Share your thoughts with the universe"}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={
            isPending ||
            isUploading ||
            !content.trim() ||
            (type !== "text" && !secondaryInput.trim() && !selectedFile) ||
            content.length > MAX_LENGTH
          }
          className="rounded-full px-6 flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
        >
          {isPending || isUploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isPending || isUploading ? "Launching..." : "Launch Post"}
          </span>
          <span className="sm:hidden">
            {isPending || isUploading ? "Launching..." : "Launch"}
          </span>
        </Button>
      </div>
    </div>
  );
}
