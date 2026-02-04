/**
 * ADK API TypeScript Types
 * Generated from OpenAPI spec at adk_openapi.json
 */

// ============================================================================
// Core Types
// ============================================================================

export interface Session {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, unknown>;
  events: Event[];
  lastUpdateTime: number;
}

export interface Event {
  id: string;
  author: string;
  invocationId: string;
  timestamp: number;
  content?: Content;
  actions: EventActions;
  partial?: boolean;
  turnComplete?: boolean;
  errorCode?: string;
  errorMessage?: string;
  interrupted?: boolean;
  customMetadata?: Record<string, unknown>;
  usageMetadata?: UsageMetadata;
  groundingMetadata?: GroundingMetadata;
  longRunningToolIds?: string[];
  branch?: string;
}

export interface EventActions {
  skipSummarization?: boolean;
  stateDelta: Record<string, unknown>;
  artifactDelta: Record<string, number>;
  transferToAgent?: string;
  escalate?: boolean;
  requestedAuthConfigs?: Record<string, AuthConfig>;
}

export interface Content {
  parts?: Part[];
  role?: string;
}

export interface Part {
  text?: string;
  inlineData?: Blob;
  fileData?: FileData;
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
  executableCode?: ExecutableCode;
  codeExecutionResult?: CodeExecutionResult;
  thought?: boolean;
  thoughtSignature?: string;
  videoMetadata?: VideoMetadata;
  mediaResolution?: MediaResolution;
}

// ============================================================================
// Function Call Types
// ============================================================================

export interface FunctionCall {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
  partialArgs?: PartialArg[];
  willContinue?: boolean;
}

export interface FunctionResponse {
  id?: string;
  name?: string;
  response?: Record<string, unknown>;
  willContinue?: boolean;
  scheduling?: FunctionResponseScheduling;
  parts?: FunctionResponsePart[];
}

export type FunctionResponseScheduling =
  | "SCHEDULING_UNSPECIFIED"
  | "SILENT"
  | "WHEN_IDLE"
  | "INTERRUPT";

export interface FunctionResponsePart {
  inlineData?: FunctionResponseBlob;
  fileData?: FunctionResponseFileData;
}

export interface FunctionResponseBlob {
  mimeType?: string;
  data?: string;
  displayName?: string;
}

export interface FunctionResponseFileData {
  fileUri?: string;
  mimeType?: string;
  displayName?: string;
}

export interface PartialArg {
  nullValue?: "NULL_VALUE";
  numberValue?: number;
  stringValue?: string;
  boolValue?: boolean;
  jsonPath?: string;
  willContinue?: boolean;
}

// ============================================================================
// Media Types
// ============================================================================

export interface Blob {
  data?: string;
  displayName?: string;
  mimeType?: string;
}

export interface FileData {
  displayName?: string;
  fileUri?: string;
  mimeType?: string;
}

export interface VideoMetadata {
  endOffset?: string;
  fps?: number;
  startOffset?: string;
}

export interface MediaResolution {
  level?: MediaResolutionLevel;
  numTokens?: number;
}

export type MediaResolutionLevel =
  | "MEDIA_RESOLUTION_UNSPECIFIED"
  | "MEDIA_RESOLUTION_LOW"
  | "MEDIA_RESOLUTION_MEDIUM"
  | "MEDIA_RESOLUTION_HIGH"
  | "MEDIA_RESOLUTION_ULTRA_HIGH";

// ============================================================================
// Code Execution Types
// ============================================================================

export interface ExecutableCode {
  code?: string;
  language?: CodeLanguage;
}

export type CodeLanguage = "LANGUAGE_UNSPECIFIED" | "PYTHON";

export interface CodeExecutionResult {
  outcome?: CodeExecutionOutcome;
  output?: string;
}

export type CodeExecutionOutcome =
  | "OUTCOME_UNSPECIFIED"
  | "OUTCOME_OK"
  | "OUTCOME_FAILED"
  | "OUTCOME_DEADLINE_EXCEEDED";

// ============================================================================
// Usage & Grounding Metadata
// ============================================================================

export interface UsageMetadata {
  cachedContentTokenCount?: number;
  candidatesTokenCount?: number;
  promptTokenCount?: number;
  thoughtsTokenCount?: number;
  toolUsePromptTokenCount?: number;
  totalTokenCount?: number;
  trafficType?: TrafficType;
  cacheTokensDetails?: ModalityTokenCount[];
  candidatesTokensDetails?: ModalityTokenCount[];
  promptTokensDetails?: ModalityTokenCount[];
  toolUsePromptTokensDetails?: ModalityTokenCount[];
}

export type TrafficType =
  | "TRAFFIC_TYPE_UNSPECIFIED"
  | "ON_DEMAND"
  | "PROVISIONED_THROUGHPUT";

export interface ModalityTokenCount {
  modality?: MediaModality;
  tokenCount?: number;
}

export type MediaModality =
  | "MODALITY_UNSPECIFIED"
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT";

export interface GroundingMetadata {
  googleMapsWidgetContextToken?: string;
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
  retrievalMetadata?: RetrievalMetadata;
  retrievalQueries?: string[];
  searchEntryPoint?: SearchEntryPoint;
  sourceFlaggingUris?: SourceFlaggingUri[];
  webSearchQueries?: string[];
}

export interface GroundingChunk {
  maps?: GroundingChunkMaps;
  retrievedContext?: GroundingChunkRetrievedContext;
  web?: GroundingChunkWeb;
}

export interface GroundingChunkMaps {
  placeAnswerSources?: PlaceAnswerSources;
  placeId?: string;
  text?: string;
  title?: string;
  uri?: string;
}

export interface PlaceAnswerSources {
  flagContentUri?: string;
  reviewSnippets?: ReviewSnippet[];
}

export interface ReviewSnippet {
  authorAttribution?: AuthorAttribution;
  flagContentUri?: string;
  googleMapsUri?: string;
  relativePublishTimeDescription?: string;
  review?: string;
  reviewId?: string;
  title?: string;
}

export interface AuthorAttribution {
  displayName?: string;
  photoUri?: string;
  uri?: string;
}

export interface GroundingChunkRetrievedContext {
  documentName?: string;
  ragChunk?: RagChunk;
  text?: string;
  title?: string;
  uri?: string;
}

export interface RagChunk {
  pageSpan?: RagChunkPageSpan;
  text?: string;
}

export interface RagChunkPageSpan {
  firstPage?: number;
  lastPage?: number;
}

export interface GroundingChunkWeb {
  domain?: string;
  title?: string;
  uri?: string;
}

export interface GroundingSupport {
  confidenceScores?: number[];
  groundingChunkIndices?: number[];
  segment?: Segment;
}

export interface Segment {
  endIndex?: number;
  partIndex?: number;
  startIndex?: number;
  text?: string;
}

export interface RetrievalMetadata {
  googleSearchDynamicRetrievalScore?: number;
}

export interface SearchEntryPoint {
  renderedContent?: string;
  sdkBlob?: string;
}

export interface SourceFlaggingUri {
  flagContentUri?: string;
  sourceId?: string;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthConfig {
  authScheme: AuthScheme;
  rawAuthCredential?: AuthCredential;
  exchangedAuthCredential?: AuthCredential;
}

export type AuthScheme =
  | APIKey
  | HTTPBase
  | OAuth2
  | OpenIdConnect
  | HTTPBearer
  | OpenIdConnectWithConfig;

export interface APIKey {
  type: "apiKey";
  description?: string;
  in: "query" | "header" | "cookie";
  name: string;
}

export interface HTTPBase {
  type: "http";
  description?: string;
  scheme: string;
}

export interface HTTPBearer {
  type: "http";
  description?: string;
  scheme: "bearer";
  bearerFormat?: string;
}

export interface OAuth2 {
  type: "oauth2";
  description?: string;
  flows: OAuthFlows;
}

export interface OAuthFlows {
  implicit?: OAuthFlowImplicit;
  password?: OAuthFlowPassword;
  clientCredentials?: OAuthFlowClientCredentials;
  authorizationCode?: OAuthFlowAuthorizationCode;
}

export interface OAuthFlowImplicit {
  refreshUrl?: string;
  scopes?: Record<string, string>;
  authorizationUrl: string;
}

export interface OAuthFlowPassword {
  refreshUrl?: string;
  scopes?: Record<string, string>;
  tokenUrl: string;
}

export interface OAuthFlowClientCredentials {
  refreshUrl?: string;
  scopes?: Record<string, string>;
  tokenUrl: string;
}

export interface OAuthFlowAuthorizationCode {
  refreshUrl?: string;
  scopes?: Record<string, string>;
  authorizationUrl: string;
  tokenUrl: string;
}

export interface OpenIdConnect {
  type: "openIdConnect";
  description?: string;
  openIdConnectUrl: string;
}

export interface OpenIdConnectWithConfig {
  type: "openIdConnect";
  description?: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  revocation_endpoint?: string;
  token_endpoint_auth_methods_supported?: string[];
  grant_types_supported?: string[];
  scopes?: string[];
}

export interface AuthCredential {
  authType: AuthCredentialType;
  resourceRef?: string;
  apiKey?: string;
  http?: HttpAuth;
  serviceAccount?: ServiceAccount;
  oauth2?: OAuth2Auth;
}

export type AuthCredentialType =
  | "apiKey"
  | "http"
  | "oauth2"
  | "openIdConnect"
  | "serviceAccount";

export interface HttpAuth {
  scheme: string;
  credentials: HttpCredentials;
}

export interface HttpCredentials {
  username?: string;
  password?: string;
  token?: string;
}

export interface ServiceAccount {
  serviceAccountCredential?: ServiceAccountCredential;
  scopes: string[];
  useDefaultCredential?: boolean;
}

export interface ServiceAccountCredential {
  type: string;
  projectId: string;
  privateKeyId: string;
  privateKey: string;
  clientEmail: string;
  clientId: string;
  authUri: string;
  tokenUri: string;
  authProviderX509CertUrl: string;
  clientX509CertUrl: string;
  universeDomain: string;
}

export interface OAuth2Auth {
  clientId?: string;
  clientSecret?: string;
  authUri?: string;
  state?: string;
  redirectUri?: string;
  authResponseUri?: string;
  authCode?: string;
  accessToken?: string;
  refreshToken?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface AgentRunRequest {
  appName: string;
  userId: string;
  sessionId: string;
  newMessage: Content;
  streaming?: boolean;
}

export interface SessionInput {
  appName: string;
  userId: string;
  state?: Record<string, unknown>;
}

// ============================================================================
// Eval Types
// ============================================================================

export interface EvalCase {
  evalId: string;
  conversation: Invocation[];
  sessionInput?: SessionInput;
  creationTimestamp: number;
}

export interface Invocation {
  invocationId: string;
  userContent: Content;
  finalResponse?: Content;
  intermediateData?: IntermediateData;
  creationTimestamp: number;
}

export interface IntermediateData {
  toolUses: FunctionCall[];
  intermediateResponses: [string, Part[]][];
}

export interface EvalMetric {
  metricName: string;
  threshold: number;
}

export interface EvalMetricResult {
  metricName: string;
  threshold: number;
  score?: number;
  evalStatus: EvalStatus;
}

export type EvalStatus = 1 | 2 | 3; // 1=unknown, 2=pass, 3=fail

export interface EvalCaseResult {
  evalSetFile: string;
  evalSetId: string;
  evalId: string;
  finalEvalStatus: EvalStatus;
  overallEvalMetricResults: EvalMetricResult[];
  evalMetricResultPerInvocation: EvalMetricResultPerInvocation[];
  sessionId: string;
  sessionDetails?: Session;
  userId?: string;
}

export interface EvalMetricResultPerInvocation {
  actualInvocation: Invocation;
  expectedInvocation: Invocation;
  evalMetricResults: EvalMetricResult[];
}

export interface EvalSetResult {
  evalSetResultId: string;
  evalSetResultName: string;
  evalSetId: string;
  evalCaseResults?: EvalCaseResult[];
  creationTimestamp: number;
}

export interface RunEvalRequest {
  evalIds: string[];
  evalMetrics: EvalMetric[];
}

export interface RunEvalResult {
  evalSetFile: string;
  evalSetId: string;
  evalId: string;
  finalEvalStatus: EvalStatus;
  overallEvalMetricResults: EvalMetricResult[];
  evalMetricResultPerInvocation: EvalMetricResultPerInvocation[];
  userId: string;
  sessionId: string;
}

export interface AddSessionToEvalSetRequest {
  evalId: string;
  sessionId: string;
  userId: string;
}
