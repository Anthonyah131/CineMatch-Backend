import { Test, TestingModule } from '@nestjs/testing';
import { HelloController } from './hello.controller';

describe('HelloController', () => {
  let controller: HelloController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HelloController],
    }).compile();

    controller = module.get<HelloController>(HelloController);
  });

  it('should return a hello message', () => {
    expect(controller.sayHello()).toEqual({
      message: '🎬 Hola Mundo desde CineMatch Backend 🚀',
    });
  });
});
