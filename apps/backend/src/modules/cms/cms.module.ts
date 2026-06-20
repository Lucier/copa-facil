import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { ARTICLE_REPOSITORY } from './domain/repositories/i-article.repository'
import { GALLERY_REPOSITORY } from './domain/repositories/i-gallery.repository'
import { VIDEO_REPOSITORY } from './domain/repositories/i-video.repository'
import { CreateArticleUseCase } from './application/use-cases/create-article.use-case'
import { UpdateArticleUseCase } from './application/use-cases/update-article.use-case'
import { DeleteArticleUseCase } from './application/use-cases/delete-article.use-case'
import { PublishArticleUseCase } from './application/use-cases/publish-article.use-case'
import { ListArticlesUseCase } from './application/use-cases/list-articles.use-case'
import { GetArticleUseCase } from './application/use-cases/get-article.use-case'
import { CreateGalleryUseCase } from './application/use-cases/create-gallery.use-case'
import { AddMediaAssetUseCase } from './application/use-cases/add-media-asset.use-case'
import { ListGalleriesUseCase } from './application/use-cases/list-galleries.use-case'
import { DeleteGalleryUseCase } from './application/use-cases/delete-gallery.use-case'
import { CreateVideoUseCase } from './application/use-cases/create-video.use-case'
import { ListVideosUseCase } from './application/use-cases/list-videos.use-case'
import { DrizzleArticleRepository } from './infrastructure/repositories/drizzle-article.repository'
import { DrizzleGalleryRepository } from './infrastructure/repositories/drizzle-gallery.repository'
import { DrizzleVideoRepository } from './infrastructure/repositories/drizzle-video.repository'
import { ArticlesController } from './presentation/controllers/articles.controller'
import { GalleriesController } from './presentation/controllers/galleries.controller'
import { VideosController } from './presentation/controllers/videos.controller'

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [
    { provide: ARTICLE_REPOSITORY, useClass: DrizzleArticleRepository },
    { provide: GALLERY_REPOSITORY, useClass: DrizzleGalleryRepository },
    { provide: VIDEO_REPOSITORY, useClass: DrizzleVideoRepository },
    CreateArticleUseCase, UpdateArticleUseCase, DeleteArticleUseCase,
    PublishArticleUseCase, ListArticlesUseCase, GetArticleUseCase,
    CreateGalleryUseCase, AddMediaAssetUseCase, ListGalleriesUseCase, DeleteGalleryUseCase,
    CreateVideoUseCase, ListVideosUseCase,
  ],
  controllers: [ArticlesController, GalleriesController, VideosController],
})
export class CmsModule {}
