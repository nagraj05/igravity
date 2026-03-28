"use client";

import {
  Heart,
  MessageCircle,
  Share2,
  Link2,
  Trash2,
  Bookmark,
  Copy,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import useDeletePost from "@/hooks/use-delete-post";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "../ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState, useMemo, useEffect } from "react";
import * as prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserTypescript from "prettier/plugins/typescript";
import parserHtml from "prettier/plugins/html";
import parserCss from "prettier/plugins/postcss";
import parserEstree from "prettier/plugins/estree";

interface PostCardProps {
  post: {
    id: string;
    clerk_user_id: string;
    content: string;
    link: string | null;
    media_type: string | null;
    created_at: string;
    profiles: {
      username: string;
      first_name: string;
      last_name: string;
      image_url: string;
    } | null;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useUser();
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();
  const [copied, setCopied] = useState(false);

  const isAuthor = user?.id === post.clerk_user_id;

  const displayName = post.profiles?.username || "Unknown User";

  const displayHandle = post.profiles?.username
    ? `@${post.profiles.username}`
    : `@${post.clerk_user_id.slice(0, 8)}`;

  // State for formatted code
  const [formattedCode, setFormattedCode] = useState(post.content);

  // Auto-format code
  useEffect(() => {
    if (!post.link?.startsWith("code:")) {
      setFormattedCode(post.content);
      return;
    }

    const formatCode = async () => {
      const language = post.link?.split(":")[1] || "javascript";

      try {
        let parser = "babel";
        let plugins: any[] = [parserBabel, parserEstree];

        // Map language to prettier parser
        if (language === "typescript" || language === "tsx") {
          parser = "typescript";
          plugins = [parserTypescript, parserEstree];
        } else if (language === "html") {
          parser = "html";
          plugins = [parserHtml];
        } else if (language === "css") {
          parser = "css";
          plugins = [parserCss];
        } else if (language === "javascript" || language === "jsx") {
          parser = "babel";
          plugins = [parserBabel, parserEstree];
        } else {
          // For languages prettier doesn't support
          setFormattedCode(post.content);
          return;
        }

        const formatted = await prettier.format(post.content, {
          parser,
          plugins,
          semi: true,
          singleQuote: false,
          tabWidth: 2,
          trailingComma: "es5",
          printWidth: 60,
        });
        setFormattedCode(formatted);
      } catch (error) {
        // Silently fail and use original content for invalid code snippets
        setFormattedCode(post.content);
      }
    };

    formatCode();
  }, [post.content, post.link]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="bg-card border rounded-lg px-6 py-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <Link
            href={`/profile/@${post.profiles?.username || post.clerk_user_id}`}
          >
            {post.profiles?.image_url ? (
              <img
                src={post.profiles.image_url}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border border-border/50 hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold hover:opacity-80 transition-opacity">
                {post.clerk_user_id.slice(0, 2).toUpperCase()}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/@${post.profiles?.username || post.clerk_user_id}`}
              className="group/name block"
            >
              <p className="font-medium group-hover/name:text-primary transition-colors truncate">
                @{displayName}
              </p>
              <p className="text-xs text-muted-foreground decoration-muted-foreground/30">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </p>
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-4">
        {post.link?.startsWith("code:") ? (
          <div className="rounded-lg overflow-hidden border border-border/50">
            <div className="bg-muted/50 px-4 py-2 text-xs font-mono border-b border-border/50 flex justify-between items-center">
              <span className="font-semibold">
                {post.link.split(":")[1].toUpperCase()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-7 px-2 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-2 h-2 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-2 h-2" />
                  </>
                )}
              </Button>
            </div>
            <div className="max-h-[500px] overflow-auto">
              <SyntaxHighlighter
                language={post.link.split(":")[1]}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  background: "transparent",
                  fontSize: "0.875rem",
                  padding: "1rem",
                }}
                showLineNumbers
                wrapLines
              >
                {formattedCode}
              </SyntaxHighlighter>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {post.link && !post.link.startsWith("code:") && (
        <div className="mb-4">
          {post.media_type === "image" ||
          post.media_type === "gif" ||
          post.link.match(/\.(jpeg|jpg|gif|png|webp|svg|avif)/i) ? (
            <div className="rounded-lg overflow-hidden border border-border/50 shadow-sm">
              <img
                src={post.link}
                alt="Post attachment"
                className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.01] transition-transform"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-all text-sm group"
            >
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <Link2 className="w-4 h-4" />
              </div>
              <div className="flex-1 truncate">
                <p className="font-medium truncate group-hover:underline text-primary">
                  {post.link}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  External Link
                </p>
              </div>
            </a>
          )}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </Link>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center">
          {isAuthor && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isDeleting}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete post"
                  variant={"icon"}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your post.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deletePost(post.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant={"icon"}
            className="text-muted-foreground hover:text-green-500 transition-colors"
          >
            <Bookmark className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
