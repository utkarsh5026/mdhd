import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useDocumentList from "./use-document-list";
import { Category } from "@/services/document";

/**
 * 🌳 Tree Node for Document Navigation
 *
 * Represents a node in the document tree structure for navigation
 */
type DocumentTreeNode = {
  type: "file" | "category";
  path: string;
  title: string;
  parent?: DocumentTreeNode;
  children: DocumentTreeNode[];
  isFile: boolean;
  fullPath: string; // For categories, this is the category path; for files, this is the file path
};

/**
 * 🧭 Document Navigation Hook
 *
 * Provides intelligent navigation functionality for moving between documents
 * using inorder traversal through the document tree structure.
 *
 * Features:
 * - Tree-based navigation through categories and files
 * - Inorder traversal for natural document ordering
 * - Seamless navigation across category boundaries
 * - Infinite scroll-like experience
 */
export const useDocumentNavigation = (currentDocumentPath?: string) => {
  const { contentIndex } = useDocumentList();
  const navigate = useNavigate();

  // Build the document tree structure
  const documentTree = useMemo(() => {
    const buildTreeFromCategory = (
      category: Category,
      parent?: DocumentTreeNode
    ): DocumentTreeNode => {
      const categoryNode: DocumentTreeNode = {
        type: "category",
        path: category.path,
        title: category.name,
        parent,
        children: [],
        isFile: false,
        fullPath: category.path,
      };

      // Add subcategories as children
      if (category.categories) {
        category.categories.forEach((subCategory) => {
          const childNode = buildTreeFromCategory(subCategory, categoryNode);
          categoryNode.children.push(childNode);
        });
      }

      // Add files as children
      if (category.files) {
        category.files.forEach((file) => {
          const fileNode: DocumentTreeNode = {
            type: "file",
            path: file.path,
            title: file.title,
            parent: categoryNode,
            children: [],
            isFile: true,
            fullPath: file.path,
          };
          categoryNode.children.push(fileNode);
        });
      }

      // Sort children: categories first, then files (both alphabetically)
      categoryNode.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "category" ? -1 : 1;
        }
        return a.title.localeCompare(b.title);
      });

      return categoryNode;
    };

    // Build root nodes from categories
    const rootNodes: DocumentTreeNode[] = [];

    if (contentIndex.categories) {
      contentIndex.categories.forEach((category) => {
        const rootNode = buildTreeFromCategory(category);
        rootNodes.push(rootNode);
      });
    }

    return rootNodes;
  }, [contentIndex]);

  // Get all file nodes in inorder traversal order
  const orderedDocuments = useMemo(() => {
    const fileNodes: DocumentTreeNode[] = [];

    const inorderTraversal = (nodes: DocumentTreeNode[]) => {
      nodes.forEach((node) => {
        if (node.isFile) {
          fileNodes.push(node);
        } else {
          // For categories, traverse children
          inorderTraversal(node.children);
        }
      });
    };

    inorderTraversal(documentTree);
    return fileNodes;
  }, [documentTree]);

  // Find current document index
  const currentIndex = useMemo(() => {
    if (!currentDocumentPath) return -1;

    // Try exact match first
    let index = orderedDocuments.findIndex(
      (doc) => doc.path === currentDocumentPath
    );

    // If not found, try with .md extension
    if (index === -1) {
      const pathWithMd = currentDocumentPath.endsWith(".md")
        ? currentDocumentPath
        : `${currentDocumentPath}.md`;
      index = orderedDocuments.findIndex((doc) => doc.path === pathWithMd);
    }

    // If still not found, try without .md extension
    if (index === -1) {
      const pathWithoutMd = currentDocumentPath.replace(".md", "");
      index = orderedDocuments.findIndex(
        (doc) => doc.path.replace(".md", "") === pathWithoutMd
      );
    }

    return index;
  }, [currentDocumentPath, orderedDocuments]);

  // Get previous document with intelligent traversal
  const previousDocument = useMemo(() => {
    if (currentIndex <= 0) {
      // If at the beginning, wrap to the last document for infinite scroll feel
      return orderedDocuments.length > 0
        ? orderedDocuments[orderedDocuments.length - 1]
        : null;
    }
    return orderedDocuments[currentIndex - 1];
  }, [currentIndex, orderedDocuments]);

  // Get next document with intelligent traversal
  const nextDocument = useMemo(() => {
    if (currentIndex >= orderedDocuments.length - 1) {
      // If at the end, wrap to the first document for infinite scroll feel
      return orderedDocuments.length > 0 ? orderedDocuments[0] : null;
    }
    return orderedDocuments[currentIndex + 1];
  }, [currentIndex, orderedDocuments]);

  // Get document context (breadcrumbs)
  const currentDocumentContext = useMemo(() => {
    const currentDoc = orderedDocuments[currentIndex];
    if (!currentDoc) return [];

    const breadcrumbs: { name: string; path: string }[] = [];
    let current = currentDoc.parent;

    while (current) {
      breadcrumbs.unshift({
        name: current.title,
        path: current.path,
      });
      current = current.parent;
    }

    return breadcrumbs;
  }, [currentIndex, orderedDocuments]);

  // Navigation functions
  const navigateToDocument = useCallback(
    (documentPath: string) => {
      const encodedPath = encodeURIComponent(documentPath.replace(".md", ""));
      navigate(`/documents/${encodedPath}`);
    },
    [navigate]
  );

  const navigateToPrevious = useCallback(() => {
    if (previousDocument) {
      navigateToDocument(previousDocument.path);
    }
  }, [previousDocument, navigateToDocument]);

  const navigateToNext = useCallback(() => {
    if (nextDocument) {
      navigateToDocument(nextDocument.path);
    }
  }, [nextDocument, navigateToDocument]);

  // Advanced navigation: jump to next/previous category
  const navigateToNextCategory = useCallback(() => {
    if (currentIndex === -1) return;

    const currentDoc = orderedDocuments[currentIndex];
    if (!currentDoc?.parent) return;

    // Find the next category at the same level
    const currentCategory = currentDoc.parent;
    const grandParent = currentCategory.parent;

    if (!grandParent) {
      // At root level, find next root category
      const rootIndex = documentTree.findIndex(
        (root) => root.path === currentCategory.path
      );
      const nextRoot = documentTree[rootIndex + 1] || documentTree[0];

      // Find first file in next root category
      const firstFileInCategory = orderedDocuments.find((doc) =>
        doc.fullPath.startsWith(nextRoot.path)
      );

      if (firstFileInCategory) {
        navigateToDocument(firstFileInCategory.path);
      }
    } else {
      // Find next sibling category
      const siblingIndex = grandParent.children.findIndex(
        (child) => child.path === currentCategory.path
      );
      const nextSibling = grandParent.children[siblingIndex + 1];

      if (nextSibling && !nextSibling.isFile) {
        // Find first file in next sibling category
        const firstFileInCategory = orderedDocuments.find((doc) =>
          doc.fullPath.startsWith(nextSibling.path)
        );

        if (firstFileInCategory) {
          navigateToDocument(firstFileInCategory.path);
        }
      }
    }
  }, [currentIndex, orderedDocuments, documentTree, navigateToDocument]);

  const navigateToPreviousCategory = useCallback(() => {
    if (currentIndex === -1) return;

    const currentDoc = orderedDocuments[currentIndex];
    if (!currentDoc?.parent) return;

    // Find the previous category at the same level
    const currentCategory = currentDoc.parent;
    const grandParent = currentCategory.parent;

    if (!grandParent) {
      // At root level, find previous root category
      const rootIndex = documentTree.findIndex(
        (root) => root.path === currentCategory.path
      );
      const prevRoot =
        documentTree[rootIndex - 1] || documentTree[documentTree.length - 1];

      // Find last file in previous root category
      const filesInCategory = orderedDocuments.filter((doc) =>
        doc.fullPath.startsWith(prevRoot.path)
      );
      const lastFileInCategory = filesInCategory[filesInCategory.length - 1];

      if (lastFileInCategory) {
        navigateToDocument(lastFileInCategory.path);
      }
    } else {
      // Find previous sibling category
      const siblingIndex = grandParent.children.findIndex(
        (child) => child.path === currentCategory.path
      );
      const prevSibling = grandParent.children[siblingIndex - 1];

      if (prevSibling && !prevSibling.isFile) {
        // Find last file in previous sibling category
        const filesInCategory = orderedDocuments.filter((doc) =>
          doc.fullPath.startsWith(prevSibling.path)
        );
        const lastFileInCategory = filesInCategory[filesInCategory.length - 1];

        if (lastFileInCategory) {
          navigateToDocument(lastFileInCategory.path);
        }
      }
    }
  }, [currentIndex, orderedDocuments, documentTree, navigateToDocument]);

  return {
    // Legacy compatibility
    orderedDocuments: orderedDocuments.map((node) => ({
      path: node.path,
      title: node.title,
    })),
    currentIndex,
    previousDocument: previousDocument
      ? {
          path: previousDocument.path,
          title: previousDocument.title,
        }
      : null,
    nextDocument: nextDocument
      ? {
          path: nextDocument.path,
          title: nextDocument.title,
        }
      : null,

    // Enhanced navigation
    documentTree,
    currentDocumentContext,
    navigateToDocument,
    navigateToPrevious,
    navigateToNext,
    navigateToNextCategory,
    navigateToPreviousCategory,

    // Navigation state
    canNavigatePrevious: previousDocument !== null,
    canNavigateNext: nextDocument !== null,
    totalDocuments: orderedDocuments.length,

    // Progress information
    progress:
      orderedDocuments.length > 0
        ? (currentIndex + 1) / orderedDocuments.length
        : 0,
  };
};
