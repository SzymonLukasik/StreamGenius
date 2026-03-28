import { z } from 'zod';
export declare const youtubeDataSchema: z.ZodObject<{
    videoId: z.ZodString;
    title: z.ZodString;
    channelName: z.ZodString;
    thumbnailUrl: z.ZodString;
    viewCount: z.ZodNumber;
    likeCount: z.ZodNumber;
    publishedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    videoId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    publishedAt: string;
}, {
    videoId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    publishedAt: string;
}>;
export declare const factDataSchema: z.ZodObject<{
    fact: z.ZodString;
    source: z.ZodString;
    sourceUrl: z.ZodString;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    fact: string;
    source: string;
    sourceUrl: string;
    confidence: number;
}, {
    fact: string;
    source: string;
    sourceUrl: string;
    confidence: number;
}>;
export declare const comparisonDataSchema: z.ZodObject<{
    itemA: z.ZodObject<{
        name: z.ZodString;
        pros: z.ZodArray<z.ZodString, "many">;
        cons: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        pros: string[];
        cons: string[];
    }, {
        name: string;
        pros: string[];
        cons: string[];
    }>;
    itemB: z.ZodObject<{
        name: z.ZodString;
        pros: z.ZodArray<z.ZodString, "many">;
        cons: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        pros: string[];
        cons: string[];
    }, {
        name: string;
        pros: string[];
        cons: string[];
    }>;
    summary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    itemA: {
        name: string;
        pros: string[];
        cons: string[];
    };
    itemB: {
        name: string;
        pros: string[];
        cons: string[];
    };
    summary: string;
}, {
    itemA: {
        name: string;
        pros: string[];
        cons: string[];
    };
    itemB: {
        name: string;
        pros: string[];
        cons: string[];
    };
    summary: string;
}>;
export declare const viewerDataSchema: z.ZodObject<{
    username: z.ZodString;
    comment: z.ZodString;
    timestamp: z.ZodNumber;
    highlightReason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    username: string;
    comment: string;
    highlightReason: string;
}, {
    timestamp: number;
    username: string;
    comment: string;
    highlightReason: string;
}>;
export declare const overlayTypeSchema: z.ZodEnum<["youtube_card", "fact_banner", "comparison", "viewer_highlight"]>;
export declare const overlayStatusSchema: z.ZodEnum<["fetching", "ready", "error"]>;
export declare const overlayDataSchema: z.ZodUnion<[z.ZodObject<{
    videoId: z.ZodString;
    title: z.ZodString;
    channelName: z.ZodString;
    thumbnailUrl: z.ZodString;
    viewCount: z.ZodNumber;
    likeCount: z.ZodNumber;
    publishedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    videoId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    publishedAt: string;
}, {
    videoId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    publishedAt: string;
}>, z.ZodObject<{
    fact: z.ZodString;
    source: z.ZodString;
    sourceUrl: z.ZodString;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    fact: string;
    source: string;
    sourceUrl: string;
    confidence: number;
}, {
    fact: string;
    source: string;
    sourceUrl: string;
    confidence: number;
}>, z.ZodObject<{
    itemA: z.ZodObject<{
        name: z.ZodString;
        pros: z.ZodArray<z.ZodString, "many">;
        cons: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        pros: string[];
        cons: string[];
    }, {
        name: string;
        pros: string[];
        cons: string[];
    }>;
    itemB: z.ZodObject<{
        name: z.ZodString;
        pros: z.ZodArray<z.ZodString, "many">;
        cons: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        pros: string[];
        cons: string[];
    }, {
        name: string;
        pros: string[];
        cons: string[];
    }>;
    summary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    itemA: {
        name: string;
        pros: string[];
        cons: string[];
    };
    itemB: {
        name: string;
        pros: string[];
        cons: string[];
    };
    summary: string;
}, {
    itemA: {
        name: string;
        pros: string[];
        cons: string[];
    };
    itemB: {
        name: string;
        pros: string[];
        cons: string[];
    };
    summary: string;
}>, z.ZodObject<{
    username: z.ZodString;
    comment: z.ZodString;
    timestamp: z.ZodNumber;
    highlightReason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    username: string;
    comment: string;
    highlightReason: string;
}, {
    timestamp: number;
    username: string;
    comment: string;
    highlightReason: string;
}>, z.ZodNull]>;
export declare const overlayProposalSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["youtube_card", "fact_banner", "comparison", "viewer_highlight"]>;
    status: z.ZodEnum<["fetching", "ready", "error"]>;
    trigger: z.ZodString;
    timestamp: z.ZodNumber;
    data: z.ZodUnion<[z.ZodObject<{
        videoId: z.ZodString;
        title: z.ZodString;
        channelName: z.ZodString;
        thumbnailUrl: z.ZodString;
        viewCount: z.ZodNumber;
        likeCount: z.ZodNumber;
        publishedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        videoId: string;
        title: string;
        channelName: string;
        thumbnailUrl: string;
        viewCount: number;
        likeCount: number;
        publishedAt: string;
    }, {
        videoId: string;
        title: string;
        channelName: string;
        thumbnailUrl: string;
        viewCount: number;
        likeCount: number;
        publishedAt: string;
    }>, z.ZodObject<{
        fact: z.ZodString;
        source: z.ZodString;
        sourceUrl: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        fact: string;
        source: string;
        sourceUrl: string;
        confidence: number;
    }, {
        fact: string;
        source: string;
        sourceUrl: string;
        confidence: number;
    }>, z.ZodObject<{
        itemA: z.ZodObject<{
            name: z.ZodString;
            pros: z.ZodArray<z.ZodString, "many">;
            cons: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            name: string;
            pros: string[];
            cons: string[];
        }, {
            name: string;
            pros: string[];
            cons: string[];
        }>;
        itemB: z.ZodObject<{
            name: z.ZodString;
            pros: z.ZodArray<z.ZodString, "many">;
            cons: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            name: string;
            pros: string[];
            cons: string[];
        }, {
            name: string;
            pros: string[];
            cons: string[];
        }>;
        summary: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        itemA: {
            name: string;
            pros: string[];
            cons: string[];
        };
        itemB: {
            name: string;
            pros: string[];
            cons: string[];
        };
        summary: string;
    }, {
        itemA: {
            name: string;
            pros: string[];
            cons: string[];
        };
        itemB: {
            name: string;
            pros: string[];
            cons: string[];
        };
        summary: string;
    }>, z.ZodObject<{
        username: z.ZodString;
        comment: z.ZodString;
        timestamp: z.ZodNumber;
        highlightReason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: number;
        username: string;
        comment: string;
        highlightReason: string;
    }, {
        timestamp: number;
        username: string;
        comment: string;
        highlightReason: string;
    }>, z.ZodNull]>;
}, "strip", z.ZodTypeAny, {
    status: "fetching" | "ready" | "error";
    id: string;
    type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
    trigger: string;
    timestamp: number;
    data: {
        videoId: string;
        title: string;
        channelName: string;
        thumbnailUrl: string;
        viewCount: number;
        likeCount: number;
        publishedAt: string;
    } | {
        fact: string;
        source: string;
        sourceUrl: string;
        confidence: number;
    } | {
        itemA: {
            name: string;
            pros: string[];
            cons: string[];
        };
        itemB: {
            name: string;
            pros: string[];
            cons: string[];
        };
        summary: string;
    } | {
        timestamp: number;
        username: string;
        comment: string;
        highlightReason: string;
    } | null;
}, {
    status: "fetching" | "ready" | "error";
    id: string;
    type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
    trigger: string;
    timestamp: number;
    data: {
        videoId: string;
        title: string;
        channelName: string;
        thumbnailUrl: string;
        viewCount: number;
        likeCount: number;
        publishedAt: string;
    } | {
        fact: string;
        source: string;
        sourceUrl: string;
        confidence: number;
    } | {
        itemA: {
            name: string;
            pros: string[];
            cons: string[];
        };
        itemB: {
            name: string;
            pros: string[];
            cons: string[];
        };
        summary: string;
    } | {
        timestamp: number;
        username: string;
        comment: string;
        highlightReason: string;
    } | null;
}>;
export declare const audioChunkMessageSchema: z.ZodObject<{
    kind: z.ZodLiteral<"audio_chunk">;
    data: z.ZodString;
}, "strip", z.ZodTypeAny, {
    data: string;
    kind: "audio_chunk";
}, {
    data: string;
    kind: "audio_chunk";
}>;
export declare const overlayApproveMessageSchema: z.ZodObject<{
    kind: z.ZodLiteral<"overlay_approve">;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    kind: "overlay_approve";
}, {
    id: string;
    kind: "overlay_approve";
}>;
export declare const overlayDismissMessageSchema: z.ZodObject<{
    kind: z.ZodLiteral<"overlay_dismiss">;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    kind: "overlay_dismiss";
}, {
    id: string;
    kind: "overlay_dismiss";
}>;
export declare const clientMessageSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"audio_chunk">;
    data: z.ZodString;
}, "strip", z.ZodTypeAny, {
    data: string;
    kind: "audio_chunk";
}, {
    data: string;
    kind: "audio_chunk";
}>, z.ZodObject<{
    kind: z.ZodLiteral<"overlay_approve">;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    kind: "overlay_approve";
}, {
    id: string;
    kind: "overlay_approve";
}>, z.ZodObject<{
    kind: z.ZodLiteral<"overlay_dismiss">;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    kind: "overlay_dismiss";
}, {
    id: string;
    kind: "overlay_dismiss";
}>]>;
export declare const transcriptMessageSchema: z.ZodObject<{
    kind: z.ZodLiteral<"transcript">;
    text: z.ZodString;
    isFinal: z.ZodBoolean;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    kind: "transcript";
    text: string;
    isFinal: boolean;
}, {
    timestamp: number;
    kind: "transcript";
    text: string;
    isFinal: boolean;
}>;
export declare const overlayProposalMessageSchema: z.ZodObject<{
    kind: z.ZodLiteral<"overlay_proposal">;
    proposal: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["youtube_card", "fact_banner", "comparison", "viewer_highlight"]>;
        status: z.ZodEnum<["fetching", "ready", "error"]>;
        trigger: z.ZodString;
        timestamp: z.ZodNumber;
        data: z.ZodUnion<[z.ZodObject<{
            videoId: z.ZodString;
            title: z.ZodString;
            channelName: z.ZodString;
            thumbnailUrl: z.ZodString;
            viewCount: z.ZodNumber;
            likeCount: z.ZodNumber;
            publishedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        }, {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        }>, z.ZodObject<{
            fact: z.ZodString;
            source: z.ZodString;
            sourceUrl: z.ZodString;
            confidence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        }, {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        }>, z.ZodObject<{
            itemA: z.ZodObject<{
                name: z.ZodString;
                pros: z.ZodArray<z.ZodString, "many">;
                cons: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                name: string;
                pros: string[];
                cons: string[];
            }, {
                name: string;
                pros: string[];
                cons: string[];
            }>;
            itemB: z.ZodObject<{
                name: z.ZodString;
                pros: z.ZodArray<z.ZodString, "many">;
                cons: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                name: string;
                pros: string[];
                cons: string[];
            }, {
                name: string;
                pros: string[];
                cons: string[];
            }>;
            summary: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        }, {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        }>, z.ZodObject<{
            username: z.ZodString;
            comment: z.ZodString;
            timestamp: z.ZodNumber;
            highlightReason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        }, {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        }>, z.ZodNull]>;
    }, "strip", z.ZodTypeAny, {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    }, {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    kind: "overlay_proposal";
    proposal: {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    };
}, {
    kind: "overlay_proposal";
    proposal: {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    };
}>;
export declare const sessionStatusMessageSchema: z.ZodObject<{
    kind: z.ZodLiteral<"session_status">;
    connected: z.ZodBoolean;
    sessionId: z.ZodString;
    reconnecting: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    kind: "session_status";
    connected: boolean;
    sessionId: string;
    reconnecting: boolean;
}, {
    kind: "session_status";
    connected: boolean;
    sessionId: string;
    reconnecting: boolean;
}>;
export declare const serverMessageSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"transcript">;
    text: z.ZodString;
    isFinal: z.ZodBoolean;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    kind: "transcript";
    text: string;
    isFinal: boolean;
}, {
    timestamp: number;
    kind: "transcript";
    text: string;
    isFinal: boolean;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"overlay_proposal">;
    proposal: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["youtube_card", "fact_banner", "comparison", "viewer_highlight"]>;
        status: z.ZodEnum<["fetching", "ready", "error"]>;
        trigger: z.ZodString;
        timestamp: z.ZodNumber;
        data: z.ZodUnion<[z.ZodObject<{
            videoId: z.ZodString;
            title: z.ZodString;
            channelName: z.ZodString;
            thumbnailUrl: z.ZodString;
            viewCount: z.ZodNumber;
            likeCount: z.ZodNumber;
            publishedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        }, {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        }>, z.ZodObject<{
            fact: z.ZodString;
            source: z.ZodString;
            sourceUrl: z.ZodString;
            confidence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        }, {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        }>, z.ZodObject<{
            itemA: z.ZodObject<{
                name: z.ZodString;
                pros: z.ZodArray<z.ZodString, "many">;
                cons: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                name: string;
                pros: string[];
                cons: string[];
            }, {
                name: string;
                pros: string[];
                cons: string[];
            }>;
            itemB: z.ZodObject<{
                name: z.ZodString;
                pros: z.ZodArray<z.ZodString, "many">;
                cons: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                name: string;
                pros: string[];
                cons: string[];
            }, {
                name: string;
                pros: string[];
                cons: string[];
            }>;
            summary: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        }, {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        }>, z.ZodObject<{
            username: z.ZodString;
            comment: z.ZodString;
            timestamp: z.ZodNumber;
            highlightReason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        }, {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        }>, z.ZodNull]>;
    }, "strip", z.ZodTypeAny, {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    }, {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    kind: "overlay_proposal";
    proposal: {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    };
}, {
    kind: "overlay_proposal";
    proposal: {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    };
}>, z.ZodObject<{
    kind: z.ZodLiteral<"session_status">;
    connected: z.ZodBoolean;
    sessionId: z.ZodString;
    reconnecting: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    kind: "session_status";
    connected: boolean;
    sessionId: string;
    reconnecting: boolean;
}, {
    kind: "session_status";
    connected: boolean;
    sessionId: string;
    reconnecting: boolean;
}>]>;
export declare const webSocketMessageSchema: z.ZodUnion<[z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"audio_chunk">;
    data: z.ZodString;
}, "strip", z.ZodTypeAny, {
    data: string;
    kind: "audio_chunk";
}, {
    data: string;
    kind: "audio_chunk";
}>, z.ZodObject<{
    kind: z.ZodLiteral<"overlay_approve">;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    kind: "overlay_approve";
}, {
    id: string;
    kind: "overlay_approve";
}>, z.ZodObject<{
    kind: z.ZodLiteral<"overlay_dismiss">;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    kind: "overlay_dismiss";
}, {
    id: string;
    kind: "overlay_dismiss";
}>]>, z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"transcript">;
    text: z.ZodString;
    isFinal: z.ZodBoolean;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    kind: "transcript";
    text: string;
    isFinal: boolean;
}, {
    timestamp: number;
    kind: "transcript";
    text: string;
    isFinal: boolean;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"overlay_proposal">;
    proposal: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["youtube_card", "fact_banner", "comparison", "viewer_highlight"]>;
        status: z.ZodEnum<["fetching", "ready", "error"]>;
        trigger: z.ZodString;
        timestamp: z.ZodNumber;
        data: z.ZodUnion<[z.ZodObject<{
            videoId: z.ZodString;
            title: z.ZodString;
            channelName: z.ZodString;
            thumbnailUrl: z.ZodString;
            viewCount: z.ZodNumber;
            likeCount: z.ZodNumber;
            publishedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        }, {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        }>, z.ZodObject<{
            fact: z.ZodString;
            source: z.ZodString;
            sourceUrl: z.ZodString;
            confidence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        }, {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        }>, z.ZodObject<{
            itemA: z.ZodObject<{
                name: z.ZodString;
                pros: z.ZodArray<z.ZodString, "many">;
                cons: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                name: string;
                pros: string[];
                cons: string[];
            }, {
                name: string;
                pros: string[];
                cons: string[];
            }>;
            itemB: z.ZodObject<{
                name: z.ZodString;
                pros: z.ZodArray<z.ZodString, "many">;
                cons: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                name: string;
                pros: string[];
                cons: string[];
            }, {
                name: string;
                pros: string[];
                cons: string[];
            }>;
            summary: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        }, {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        }>, z.ZodObject<{
            username: z.ZodString;
            comment: z.ZodString;
            timestamp: z.ZodNumber;
            highlightReason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        }, {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        }>, z.ZodNull]>;
    }, "strip", z.ZodTypeAny, {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    }, {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    kind: "overlay_proposal";
    proposal: {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    };
}, {
    kind: "overlay_proposal";
    proposal: {
        status: "fetching" | "ready" | "error";
        id: string;
        type: "youtube_card" | "fact_banner" | "comparison" | "viewer_highlight";
        trigger: string;
        timestamp: number;
        data: {
            videoId: string;
            title: string;
            channelName: string;
            thumbnailUrl: string;
            viewCount: number;
            likeCount: number;
            publishedAt: string;
        } | {
            fact: string;
            source: string;
            sourceUrl: string;
            confidence: number;
        } | {
            itemA: {
                name: string;
                pros: string[];
                cons: string[];
            };
            itemB: {
                name: string;
                pros: string[];
                cons: string[];
            };
            summary: string;
        } | {
            timestamp: number;
            username: string;
            comment: string;
            highlightReason: string;
        } | null;
    };
}>, z.ZodObject<{
    kind: z.ZodLiteral<"session_status">;
    connected: z.ZodBoolean;
    sessionId: z.ZodString;
    reconnecting: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    kind: "session_status";
    connected: boolean;
    sessionId: string;
    reconnecting: boolean;
}, {
    kind: "session_status";
    connected: boolean;
    sessionId: string;
    reconnecting: boolean;
}>]>]>;
export type ValidatedClientMessage = z.infer<typeof clientMessageSchema>;
export type ValidatedServerMessage = z.infer<typeof serverMessageSchema>;
//# sourceMappingURL=index.d.ts.map